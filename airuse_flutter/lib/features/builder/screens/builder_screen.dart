import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

const String _apiBase = 'https://airuse-tailor-4pej.vercel.app/api';

class BuilderScreen extends StatefulWidget {
  const BuilderScreen({super.key});

  @override
  State<BuilderScreen> createState() => _BuilderScreenState();
}

class _BuilderScreenState extends State<BuilderScreen> {
  final _resumeCtrl = TextEditingController();
  final _jobCtrl = TextEditingController();
  final _titleCtrl = TextEditingController();
  bool _loading = false;
  String? _error;
  Map<String, dynamic>? _result;

  final _supabase = Supabase.instance.client;

  @override
  void dispose() {
    _resumeCtrl.dispose();
    _jobCtrl.dispose();
    _titleCtrl.dispose();
    super.dispose();
  }

  Future<void> _tailorResume() async {
    if (_resumeCtrl.text.trim().isEmpty || _jobCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Please fill in both your resume and the job description.');
      return;
    }
    setState(() { _loading = true; _error = null; _result = null; });
    try {
      final token = _supabase.auth.currentSession?.accessToken;
      final res = await http.post(
        Uri.parse('$_apiBase/tailor'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'resumeText': _resumeCtrl.text.trim(),
          'jobDescription': _jobCtrl.text.trim(),
          'title': _titleCtrl.text.trim().isEmpty ? null : _titleCtrl.text.trim(),
        }),
      ).timeout(const Duration(seconds: 120));

      final data = json.decode(res.body);
      if (res.statusCode != 200) throw Exception(data['error'] ?? 'Tailoring failed');
      setState(() { _result = data; _loading = false; });
    } catch (e) {
      setState(() {
        _error = e.toString().contains('TimeoutException')
          ? 'Request timed out. Please try again.'
          : e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width > 900;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => context.go('/dashboard'),
                    child: const Icon(Icons.arrow_back_ios_new_rounded,
                      color: Color(0xFF8888A8), size: 20)),
                  const SizedBox(width: 16),
                  Text('Resume Builder', style: GoogleFonts.inter(
                    fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
                ],
              ).animate().fadeIn(duration: 400.ms),
            ),
            const Divider(height: 1),

            Expanded(
              child: _result != null
                ? _ResultView(
                    result: _result!,
                    onBuildAnother: () => setState(() { _result = null; }),
                    onGoToDashboard: () => context.go('/dashboard'),
                  )
                : SingleChildScrollView(
                    padding: EdgeInsets.all(isWide ? 40 : 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Instructions
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFF7C6FF7).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFF7C6FF7).withOpacity(0.2)),
                          ),
                          child: Row(children: [
                            const Icon(Icons.info_outline_rounded,
                              color: Color(0xFF7C6FF7), size: 18),
                            const SizedBox(width: 10),
                            Expanded(child: Text(
                              'Paste your resume and a job description — AI will tailor it in ~30 seconds.',
                              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF7C6FF7)))),
                          ]),
                        ).animate().fadeIn(delay: 100.ms),

                        const SizedBox(height: 24),

                        // Title field
                        Text('Resume Title (optional)', style: GoogleFonts.inter(
                          fontSize: 14, fontWeight: FontWeight.w500, color: const Color(0xFFB0B0C8))),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _titleCtrl,
                          decoration: const InputDecoration(
                            hintText: 'e.g. Google SWE Application',
                            prefixIcon: Icon(Icons.label_outline_rounded, color: Color(0xFF5A5A78)),
                          ),
                        ).animate().fadeIn(delay: 150.ms),

                        const SizedBox(height: 20),

                        // Resume field
                        Text('Your Current Resume', style: GoogleFonts.inter(
                          fontSize: 14, fontWeight: FontWeight.w500, color: const Color(0xFFB0B0C8))),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _resumeCtrl,
                          maxLines: isWide ? 12 : 8,
                          decoration: const InputDecoration(
                            hintText: 'Paste your full resume text here...',
                            alignLabelWithHint: true,
                          ),
                        ).animate().fadeIn(delay: 200.ms),

                        const SizedBox(height: 20),

                        // Job description field
                        Text('Job Description', style: GoogleFonts.inter(
                          fontSize: 14, fontWeight: FontWeight.w500, color: const Color(0xFFB0B0C8))),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _jobCtrl,
                          maxLines: isWide ? 10 : 7,
                          decoration: const InputDecoration(
                            hintText: 'Paste the full job description here...',
                            alignLabelWithHint: true,
                          ),
                        ).animate().fadeIn(delay: 250.ms),

                        const SizedBox(height: 12),

                        if (_error != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFF4757).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: const Color(0xFFFF4757).withOpacity(0.3)),
                            ),
                            child: Row(children: [
                              const Icon(Icons.error_outline_rounded,
                                color: Color(0xFFFF4757), size: 18),
                              const SizedBox(width: 10),
                              Expanded(child: Text(_error!, style: GoogleFonts.inter(
                                fontSize: 13, color: const Color(0xFFFF4757)))),
                            ]),
                          ),
                        ],

                        const SizedBox(height: 24),

                        // Tailor button
                        SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: ElevatedButton(
                            onPressed: _loading ? null : _tailorResume,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF7C6FF7),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16)),
                              elevation: 0,
                            ),
                            child: _loading
                              ? Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const SizedBox(width: 20, height: 20,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)),
                                    const SizedBox(width: 12),
                                    Text('Tailoring your resume...', style: GoogleFonts.inter(
                                      fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
                                  ],
                                )
                              : Text('✨ Tailor My Resume', style: GoogleFonts.inter(
                                  fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
                          ),
                        ).animate().fadeIn(delay: 300.ms),

                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ResultView extends StatelessWidget {
  final Map<String, dynamic> result;
  final VoidCallback onBuildAnother;
  final VoidCallback onGoToDashboard;
  const _ResultView({required this.result, required this.onBuildAnother, required this.onGoToDashboard});

  @override
  Widget build(BuildContext context) {
    final score = result['ats_score'] as int?;
    final plainText = result['plain_text'] as String? ?? '';

    Color scoreColor = const Color(0xFF06D6A0);
    if (score != null && score < 85) scoreColor = const Color(0xFFFFAA00);
    if (score != null && score < 70) scoreColor = const Color(0xFFFF4757);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Success header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF06D6A0).withOpacity(0.08),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF06D6A0).withOpacity(0.2)),
            ),
            child: Row(children: [
              const Text('🎉', style: TextStyle(fontSize: 32)),
              const SizedBox(width: 16),
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Resume Tailored!', style: GoogleFonts.inter(
                    fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
                  if (score != null)
                    Text('ATS Score: $score/100', style: GoogleFonts.inter(
                      fontSize: 14, color: scoreColor, fontWeight: FontWeight.w600)),
                ],
              )),
              if (score != null)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: scoreColor.withOpacity(0.15),
                    border: Border.all(color: scoreColor.withOpacity(0.3)),
                  ),
                  child: Text('$score', style: GoogleFonts.inter(
                    fontSize: 20, fontWeight: FontWeight.w800, color: scoreColor)),
                ),
            ]),
          ).animate().fadeIn(duration: 400.ms).scale(begin: const Offset(0.95, 0.95)),

          const SizedBox(height: 24),

          Text('Your Tailored Resume', style: GoogleFonts.inter(
            fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
          const SizedBox(height: 12),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF0D0D15),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFF1E1E30)),
            ),
            child: SelectableText(
              plainText,
              style: GoogleFonts.sourceCodePro(
                fontSize: 12.5, color: const Color(0xFFB0B0C8), height: 1.6),
            ),
          ).animate().fadeIn(delay: 200.ms),

          const SizedBox(height: 28),

          Row(children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: onBuildAnother,
                icon: const Icon(Icons.add_rounded),
                label: Text('Build Another', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(0, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: onGoToDashboard,
                icon: const Icon(Icons.dashboard_outlined),
                label: Text('Dashboard', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(0, 50),
                  backgroundColor: const Color(0xFF7C6FF7),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),
          ]).animate().fadeIn(delay: 300.ms),
        ],
      ),
    );
  }
}
