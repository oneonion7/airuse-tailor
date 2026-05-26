import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isWide = size.width > 800;

    return Scaffold(
      body: Stack(
        children: [
          // Background orbs
          Positioned(top: -100, right: -100,
            child: _Orb(size: 500, color: const Color(0xFF7C6FF7).withOpacity(0.15))),
          Positioned(bottom: -150, left: -100,
            child: _Orb(size: 600, color: const Color(0xFF06D6A0).withOpacity(0.08))),

          SafeArea(
            child: SingleChildScrollView(
              child: Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: isWide ? 64 : 24,
                  vertical: 24,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Nav
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _Logo(),
                        Row(
                          children: [
                            TextButton(
                              onPressed: () => context.go('/login'),
                              child: const Text('Log In', style: TextStyle(color: Color(0xFFB0B0C8))),
                            ),
                            const SizedBox(width: 8),
                            _PrimaryButton(
                              label: 'Get Started',
                              onTap: () => context.go('/signup'),
                              compact: true,
                            ),
                          ],
                        ),
                      ],
                    ).animate().fadeIn(duration: 600.ms),

                    const SizedBox(height: 80),

                    // Hero
                    Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF7C6FF7).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(100),
                            border: Border.all(color: const Color(0xFF7C6FF7).withOpacity(0.3)),
                          ),
                          child: Text(
                            '✨ AI-Powered Resume Tailoring',
                            style: GoogleFonts.inter(
                              color: const Color(0xFF7C6FF7),
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                        ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2),

                        const SizedBox(height: 28),

                        Text(
                          'Land More Interviews\nwith AI-Tailored Resumes',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            fontSize: isWide ? 52 : 36,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            height: 1.15,
                            letterSpacing: -1.5,
                          ),
                        ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2),

                        const SizedBox(height: 20),

                        Text(
                          'Paste any job description. AirUse rewrites your resume\nto beat ATS filters and match the role — in seconds.',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            fontSize: isWide ? 18 : 16,
                            color: const Color(0xFF8888A8),
                            height: 1.6,
                          ),
                        ).animate().fadeIn(delay: 400.ms),

                        const SizedBox(height: 40),

                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            _PrimaryButton(
                              label: '🚀 Build My Resume',
                              onTap: () => context.go('/signup'),
                            ),
                          ],
                        ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.1),

                        const SizedBox(height: 16),

                        Text(
                          'Free forever · No credit card · 5 min setup',
                          style: GoogleFonts.inter(
                            fontSize: 13, color: const Color(0xFF5A5A78),
                          ),
                        ).animate().fadeIn(delay: 600.ms),
                      ],
                    ),

                    const SizedBox(height: 80),

                    // Stats row
                    _StatsRow().animate().fadeIn(delay: 700.ms),

                    const SizedBox(height: 80),

                    // Features
                    _FeaturesSection(isWide: isWide)
                        .animate().fadeIn(delay: 800.ms),

                    const SizedBox(height: 80),

                    // CTA
                    _CTASection(isWide: isWide).animate().fadeIn(delay: 900.ms),
                    const SizedBox(height: 48),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Logo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(
        children: [
          TextSpan(
            text: 'Air',
            style: GoogleFonts.inter(
              fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white,
            ),
          ),
          TextSpan(
            text: 'Use',
            style: GoogleFonts.inter(
              fontSize: 22, fontWeight: FontWeight.w800,
              color: const Color(0xFF7C6FF7),
            ),
          ),
        ],
      ),
    );
  }
}

class _Orb extends StatelessWidget {
  final double size;
  final Color color;
  const _Orb({required this.size, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
  }
}

class _PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final bool compact;
  const _PrimaryButton({required this.label, required this.onTap, this.compact = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: compact ? 20 : 32,
          vertical: compact ? 12 : 16,
        ),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF7C6FF7), Color(0xFF5B8AF7)],
          ),
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF7C6FF7).withOpacity(0.35),
              blurRadius: 20, offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: compact ? 14 : 16,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final stats = [
      ('10K+', 'Resumes Built'),
      ('94%', 'ATS Pass Rate'),
      ('3×', 'More Interviews'),
    ];
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: stats.map((s) => Expanded(
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 8),
          padding: const EdgeInsets.symmetric(vertical: 20),
          decoration: BoxDecoration(
            color: const Color(0xFF12121A),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF1E1E30)),
          ),
          child: Column(
            children: [
              Text(s.$1, style: GoogleFonts.inter(
                fontSize: 28, fontWeight: FontWeight.w800, color: const Color(0xFF7C6FF7),
              )),
              const SizedBox(height: 4),
              Text(s.$2, style: GoogleFonts.inter(
                fontSize: 12, color: const Color(0xFF8888A8),
              )),
            ],
          ),
        ),
      )).toList(),
    );
  }
}

class _FeaturesSection extends StatelessWidget {
  final bool isWide;
  const _FeaturesSection({required this.isWide});

  @override
  Widget build(BuildContext context) {
    final features = [
      ('⚡', 'Instant Tailoring', 'Paste any job description and get a tailored resume in under 60 seconds.'),
      ('🎯', 'ATS Optimized', 'Our AI scores your resume and rewrites it to pass automated screening.'),
      ('📄', 'Multiple Formats', 'Download as PDF, Word DOCX, or plain ATS text instantly.'),
      ('🔒', 'Secure & Private', 'Your data is encrypted and never shared. Delete anytime.'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          'Everything you need to get hired',
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(
            fontSize: 28, fontWeight: FontWeight.w700, color: Colors.white,
          ),
        ),
        const SizedBox(height: 32),
        isWide
            ? Row(
                children: features.map((f) => Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: _FeatureCard(icon: f.$1, title: f.$2, desc: f.$3),
                  ),
                )).toList(),
              )
            : Column(
                children: features.map((f) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _FeatureCard(icon: f.$1, title: f.$2, desc: f.$3),
                )).toList(),
              ),
      ],
    );
  }
}

class _FeatureCard extends StatelessWidget {
  final String icon, title, desc;
  const _FeatureCard({required this.icon, required this.title, required this.desc});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF12121A),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF1E1E30)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(icon, style: const TextStyle(fontSize: 32)),
          const SizedBox(height: 12),
          Text(title, style: GoogleFonts.inter(
            fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white,
          )),
          const SizedBox(height: 8),
          Text(desc, style: GoogleFonts.inter(
            fontSize: 13, color: const Color(0xFF8888A8), height: 1.5,
          )),
        ],
      ),
    );
  }
}

class _CTASection extends StatelessWidget {
  final bool isWide;
  const _CTASection({required this.isWide});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(48),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF7C6FF7).withOpacity(0.15),
            const Color(0xFF5B8AF7).withOpacity(0.08),
          ],
        ),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFF7C6FF7).withOpacity(0.2)),
      ),
      child: Column(
        children: [
          Text('Ready to land your dream job?',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: isWide ? 32 : 24,
              fontWeight: FontWeight.w700, color: Colors.white,
            )),
          const SizedBox(height: 12),
          Text('Join thousands of job seekers getting more interviews with AirUse.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 15, color: const Color(0xFF8888A8))),
          const SizedBox(height: 28),
          _PrimaryButton(label: '🚀 Start for Free', onTap: () => context.go('/signup')),
        ],
      ),
    );
  }
}
