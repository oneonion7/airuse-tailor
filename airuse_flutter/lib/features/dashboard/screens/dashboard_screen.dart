import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

const String _apiBase = 'https://airuse-tailor-4pej.vercel.app/api';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _supabase = Supabase.instance.client;
  List<Map<String, dynamic>> _resumes = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadResumes();
  }

  Future<String?> _getToken() async {
    return _supabase.auth.currentSession?.accessToken;
  }

  Future<void> _loadResumes() async {
    setState(() { _loading = true; _error = null; });
    try {
      final token = await _getToken();
      final res = await http.get(
        Uri.parse('$_apiBase/resumes'),
        headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      );
      final data = json.decode(res.body);
      if (res.statusCode != 200) throw Exception(data['error'] ?? 'Failed to load');
      setState(() {
        _resumes = List<Map<String, dynamic>>.from(data['resumes'] ?? []);
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _deleteResume(String id) async {
    try {
      final token = await _getToken();
      await http.delete(
        Uri.parse('$_apiBase/resumes/$id'),
        headers: {'Authorization': 'Bearer $token'},
      );
      setState(() => _resumes.removeWhere((r) => r['id'] == id));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to delete. Please try again.')));
    }
  }

  Future<void> _signOut() async {
    await _supabase.auth.signOut();
    if (mounted) context.go('/');
  }

  @override
  Widget build(BuildContext context) {
    final user = _supabase.auth.currentUser;
    final name = user?.userMetadata?['full_name'] as String? ?? user?.email ?? 'User';
    final initials = name.split(' ').map((n) => n.isEmpty ? '' : n[0]).take(2).join().toUpperCase();
    final isWide = MediaQuery.of(context).size.width > 800;

    return Scaffold(
      body: Stack(
        children: [
          Positioned(top: -100, right: -100,
            child: Container(width: 400, height: 400,
              decoration: BoxDecoration(shape: BoxShape.circle,
                color: const Color(0xFF7C6FF7).withOpacity(0.08)))),

          SafeArea(
            child: Column(
              children: [
                // App bar
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: isWide ? 32 : 20, vertical: 16),
                  child: Row(
                    children: [
                      RichText(text: TextSpan(children: [
                        TextSpan(text: 'Air', style: GoogleFonts.inter(
                          fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
                        TextSpan(text: 'Use', style: GoogleFonts.inter(
                          fontSize: 22, fontWeight: FontWeight.w800, color: const Color(0xFF7C6FF7))),
                      ])),
                      const Spacer(),
                      // New Resume button
                      GestureDetector(
                        onTap: () => context.go('/builder'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF7C6FF7), Color(0xFF5B8AF7)]),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(children: [
                            const Icon(Icons.add_rounded, color: Colors.white, size: 18),
                            const SizedBox(width: 6),
                            Text('New Resume', style: GoogleFonts.inter(
                              fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
                          ]),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Avatar
                      GestureDetector(
                        onTap: () => _showUserMenu(context),
                        child: Container(
                          width: 40, height: 40,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: const LinearGradient(
                              colors: [Color(0xFF7C6FF7), Color(0xFF5B8AF7)]),
                          ),
                          child: Center(child: Text(initials,
                            style: GoogleFonts.inter(
                              fontSize: 14, fontWeight: FontWeight.w700, color: Colors.white))),
                        ),
                      ),
                    ],
                  ).animate().fadeIn(duration: 400.ms),
                ),

                const Divider(height: 1),

                Expanded(
                  child: _loading
                    ? const Center(child: CircularProgressIndicator(color: Color(0xFF7C6FF7)))
                    : _error != null
                      ? _ErrorState(error: _error!, onRetry: _loadResumes)
                      : _resumes.isEmpty
                        ? _EmptyState(onBuild: () => context.go('/builder'))
                        : RefreshIndicator(
                            onRefresh: _loadResumes,
                            color: const Color(0xFF7C6FF7),
                            child: CustomScrollView(
                              slivers: [
                                SliverPadding(
                                  padding: EdgeInsets.all(isWide ? 32 : 20),
                                  sliver: SliverToBoxAdapter(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('My Resumes', style: GoogleFonts.inter(
                                          fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white)),
                                        const SizedBox(height: 6),
                                        Text('${_resumes.length} resume${_resumes.length == 1 ? '' : 's'} saved',
                                          style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF8888A8))),
                                        const SizedBox(height: 20),

                                        // Stats row
                                        _buildStats(),
                                        const SizedBox(height: 28),
                                      ],
                                    ),
                                  ),
                                ),
                                SliverPadding(
                                  padding: EdgeInsets.symmetric(horizontal: isWide ? 32 : 20),
                                  sliver: isWide
                                    ? SliverGrid(
                                        delegate: SliverChildBuilderDelegate(
                                          (ctx, i) => _ResumeCard(
                                            resume: _resumes[i],
                                            index: i,
                                            onDelete: () => _confirmDelete(_resumes[i]['id']),
                                            onDownloadTxt: () => _downloadTxt(_resumes[i]),
                                          ),
                                          childCount: _resumes.length,
                                        ),
                                        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                                          maxCrossAxisExtent: 380,
                                          childAspectRatio: 1.3,
                                          crossAxisSpacing: 16,
                                          mainAxisSpacing: 16,
                                        ),
                                      )
                                    : SliverList(
                                        delegate: SliverChildBuilderDelegate(
                                          (ctx, i) => Padding(
                                            padding: const EdgeInsets.only(bottom: 14),
                                            child: _ResumeCard(
                                              resume: _resumes[i],
                                              index: i,
                                              onDelete: () => _confirmDelete(_resumes[i]['id']),
                                              onDownloadTxt: () => _downloadTxt(_resumes[i]),
                                            ),
                                          ),
                                          childCount: _resumes.length,
                                        ),
                                      ),
                                ),
                                const SliverPadding(padding: EdgeInsets.only(bottom: 40)),
                              ],
                            ),
                          ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStats() {
    final scores = _resumes.map((r) => r['ats_score'] as int?).whereType<int>().toList();
    final best = scores.isEmpty ? null : scores.reduce((a, b) => a > b ? a : b);
    final latest = _resumes.isNotEmpty
      ? _formatDate(_resumes.first['created_at']) : '—';

    return Row(children: [
      _StatChip(label: 'Total', value: '${_resumes.length}'),
      const SizedBox(width: 12),
      _StatChip(label: 'Best ATS', value: best != null ? '$best' : '—'),
      const SizedBox(width: 12),
      Expanded(child: _StatChip(label: 'Latest', value: latest)),
    ]);
  }

  void _confirmDelete(String id) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF12121A),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Delete Resume?', style: GoogleFonts.inter(
          fontWeight: FontWeight.w700, color: Colors.white)),
        content: Text('This action cannot be undone.',
          style: GoogleFonts.inter(color: const Color(0xFF8888A8))),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: GoogleFonts.inter(color: const Color(0xFF8888A8)))),
          TextButton(
            onPressed: () { Navigator.pop(context); _deleteResume(id); },
            child: Text('Delete', style: GoogleFonts.inter(color: const Color(0xFFFF4757)))),
        ],
      ),
    );
  }

  void _downloadTxt(Map<String, dynamic> r) {
    final text = r['plain_text'] as String?;
    if (text == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No text version available.')));
      return;
    }
    // On mobile/web, show in a modal for now
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF12121A),
        title: Text(r['title'] ?? 'ATS Text', style: GoogleFonts.inter(color: Colors.white)),
        content: SizedBox(
          width: 600,
          child: SingleChildScrollView(
            child: SelectableText(text, style: GoogleFonts.sourceCodePro(
              fontSize: 12, color: const Color(0xFFB0B0C8))),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context),
            child: Text('Close', style: GoogleFonts.inter(color: const Color(0xFF7C6FF7)))),
        ],
      ),
    );
  }

  void _showUserMenu(BuildContext context) {
    final user = _supabase.auth.currentUser;
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF12121A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 40, height: 4,
              decoration: BoxDecoration(color: const Color(0xFF2A2A40),
                borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 20),
            Text(user?.email ?? '', style: GoogleFonts.inter(
              fontSize: 14, color: const Color(0xFF8888A8))),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.logout_rounded, color: Color(0xFFFF4757)),
              title: Text('Sign Out', style: GoogleFonts.inter(color: const Color(0xFFFF4757))),
              onTap: () { Navigator.pop(context); _signOut(); },
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String? iso) {
    if (iso == null) return '—';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '—';
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
  }
}

class _StatChip extends StatelessWidget {
  final String label, value;
  const _StatChip({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF12121A),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF1E1E30)),
      ),
      child: Column(
        children: [
          Text(value, style: GoogleFonts.inter(
            fontSize: 20, fontWeight: FontWeight.w700, color: const Color(0xFF7C6FF7))),
          Text(label, style: GoogleFonts.inter(
            fontSize: 11, color: const Color(0xFF8888A8))),
        ],
      ),
    );
  }
}

class _ResumeCard extends StatelessWidget {
  final Map<String, dynamic> resume;
  final int index;
  final VoidCallback onDelete;
  final VoidCallback onDownloadTxt;
  const _ResumeCard({required this.resume, required this.index,
    required this.onDelete, required this.onDownloadTxt});

  String _formatDate(String? iso) {
    if (iso == null) return '—';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '—';
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
  }

  @override
  Widget build(BuildContext context) {
    final score = resume['ats_score'] as int?;
    final title = resume['title'] as String? ?? 'Untitled Resume';
    final date = _formatDate(resume['created_at'] as String?);

    Color scoreColor = const Color(0xFF06D6A0);
    if (score != null && score < 85) scoreColor = const Color(0xFFFFAA00);
    if (score != null && score < 70) scoreColor = const Color(0xFFFF4757);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF12121A),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF1E1E30)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(title, style: GoogleFonts.inter(
                  fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white),
                  maxLines: 2, overflow: TextOverflow.ellipsis)),
              if (score != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: scoreColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: scoreColor.withOpacity(0.3)),
                  ),
                  child: Text('ATS $score', style: GoogleFonts.inter(
                    fontSize: 12, fontWeight: FontWeight.w600, color: scoreColor)),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(date, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF5A5A78))),
          const Spacer(),
          Row(
            children: [
              _ActionButton(icon: Icons.text_snippet_outlined, label: 'ATS Text', onTap: onDownloadTxt),
              const SizedBox(width: 8),
              _ActionButton(icon: Icons.delete_outline_rounded, label: 'Delete',
                onTap: onDelete, isDestructive: true),
            ],
          ),
        ],
      ),
    ).animate(delay: Duration(milliseconds: index * 60))
     .fadeIn(duration: 400.ms).slideY(begin: 0.1);
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isDestructive;
  const _ActionButton({required this.icon, required this.label,
    required this.onTap, this.isDestructive = false});

  @override
  Widget build(BuildContext context) {
    final color = isDestructive ? const Color(0xFFFF4757) : const Color(0xFF7C6FF7);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Row(children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: color, fontWeight: FontWeight.w500)),
        ]),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final VoidCallback onBuild;
  const _EmptyState({required this.onBuild});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('📄', style: TextStyle(fontSize: 64)),
            const SizedBox(height: 20),
            Text('No resumes yet', style: GoogleFonts.inter(
              fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white)),
            const SizedBox(height: 10),
            Text('Build your first AI-tailored resume in minutes.',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(fontSize: 15, color: const Color(0xFF8888A8))),
            const SizedBox(height: 28),
            GestureDetector(
              onTap: onBuild,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF7C6FF7), Color(0xFF5B8AF7)]),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text('🚀 Build My Resume', style: GoogleFonts.inter(
                  fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
              ),
            ),
          ],
        ).animate().fadeIn(duration: 600.ms).scale(begin: const Offset(0.95, 0.95)),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;
  const _ErrorState({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.wifi_off_rounded, size: 48, color: Color(0xFF5A5A78)),
          const SizedBox(height: 16),
          Text('Failed to load resumes', style: GoogleFonts.inter(
            fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white)),
          const SizedBox(height: 8),
          Text(error, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF8888A8))),
          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}
