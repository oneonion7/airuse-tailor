import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

class GoogleSignInButton extends StatefulWidget {
  final String label;
  final String redirectTo;
  const GoogleSignInButton({super.key, required this.label, required this.redirectTo});

  @override
  State<GoogleSignInButton> createState() => _GoogleSignInButtonState();
}

class _GoogleSignInButtonState extends State<GoogleSignInButton> {
  bool _loading = false;

  Future<void> _signInWithGoogle() async {
    setState(() => _loading = true);
    try {
      await Supabase.instance.client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: widget.redirectTo,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Google sign-in failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _loading ? null : _signInWithGoogle,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: double.infinity,
        height: 54,
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A28),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: _loading
              ? const Color(0xFF2A2A40)
              : const Color(0xFF2A2A40),
          ),
        ),
        child: _loading
          ? const Center(child: SizedBox(width: 20, height: 20,
              child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF7C6FF7))))
          : Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Google logo SVG as colored icon
                _GoogleIcon(),
                const SizedBox(width: 12),
                Text(widget.label,
                  style: GoogleFonts.inter(
                    fontSize: 15, fontWeight: FontWeight.w500, color: Colors.white,
                  )),
              ],
            ),
      ),
    );
  }
}

class _GoogleIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 20, height: 20,
      child: CustomPaint(painter: _GoogleLogoPainter()),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;
    // Simplified Google G
    paint.color = const Color(0xFFFFC107);
    canvas.drawArc(Rect.fromLTWH(0, 0, size.width, size.height),
        -0.3, 3.0, false, paint..style = PaintingStyle.stroke..strokeWidth = 4);

    paint.color = const Color(0xFF4285F4);
    canvas.drawRect(Rect.fromLTWH(size.width * 0.5, size.height * 0.35,
        size.width * 0.5, size.height * 0.3), paint..style = PaintingStyle.fill);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
