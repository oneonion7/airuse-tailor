import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../widgets/auth_card.dart';
import '../widgets/google_sign_in_button.dart';
import '../widgets/auth_divider.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  String? _error;
  String? _success;

  final _supabase = Supabase.instance.client;

  @override
  void dispose() {
    _nameCtrl.dispose(); _emailCtrl.dispose();
    _passCtrl.dispose(); _confirmCtrl.dispose();
    super.dispose();
  }

  int _getPasswordStrength(String pw) {
    int s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (RegExp(r'[A-Z]').hasMatch(pw) && RegExp(r'[a-z]').hasMatch(pw)) s++;
    if (RegExp(r'[0-9]').hasMatch(pw) || RegExp(r'[^A-Za-z0-9]').hasMatch(pw)) s++;
    return s;
  }

  Future<void> _signup() async {
    if (!_formKey.currentState!.validate()) return;
    if (_passCtrl.text != _confirmCtrl.text) {
      setState(() => _error = 'Passwords do not match.');
      return;
    }
    setState(() { _loading = true; _error = null; _success = null; });
    try {
      await _supabase.auth.signUp(
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
        data: {'full_name': _nameCtrl.text.trim()},
      );
      setState(() {
        _success = '✅ Account created! Check your email to confirm, then log in.';
        _loading = false;
      });
    } on AuthException catch (e) {
      setState(() { _error = e.message; _loading = false; });
    } catch (e) {
      setState(() { _error = 'Signup failed. Please try again.'; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Positioned(top: -120, right: -80,
            child: Container(width: 400, height: 400,
              decoration: BoxDecoration(shape: BoxShape.circle,
                color: const Color(0xFF7C6FF7).withOpacity(0.12)))),
          Positioned(bottom: -100, left: -60,
            child: Container(width: 350, height: 350,
              decoration: BoxDecoration(shape: BoxShape.circle,
                color: const Color(0xFF06D6A0).withOpacity(0.07)))),

          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Row(
                    children: [
                      GestureDetector(
                        onTap: () => context.go('/'),
                        child: const Icon(Icons.arrow_back_ios_new_rounded,
                          color: Color(0xFF8888A8), size: 20)),
                      const Spacer(),
                      RichText(text: TextSpan(children: [
                        TextSpan(text: 'Air', style: GoogleFonts.inter(
                          fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
                        TextSpan(text: 'Use', style: GoogleFonts.inter(
                          fontSize: 20, fontWeight: FontWeight.w800, color: const Color(0xFF7C6FF7))),
                      ])),
                      const Spacer(), const SizedBox(width: 20),
                    ],
                  ).animate().fadeIn(duration: 400.ms),

                  const SizedBox(height: 32),

                  AuthCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Create your account', style: GoogleFonts.inter(
                          fontSize: 26, fontWeight: FontWeight.w700, color: Colors.white)),
                        const SizedBox(height: 6),
                        Text('Free forever · No credit card required',
                          style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF8888A8))),
                        const SizedBox(height: 24),

                        if (_error != null) ...[
                          _Alert(message: _error!, isError: true),
                          const SizedBox(height: 16),
                        ],
                        if (_success != null) ...[
                          _Alert(message: _success!, isError: false),
                          const SizedBox(height: 16),
                        ],

                        GoogleSignInButton(
                          label: 'Continue with Google',
                          redirectTo: 'https://airuse-tailor-4pej.vercel.app/dashboard',
                        ),
                        const SizedBox(height: 20),
                        const AuthDivider(label: 'or sign up with email'),
                        const SizedBox(height: 20),

                        Form(
                          key: _formKey,
                          child: Column(
                            children: [
                              TextFormField(
                                controller: _nameCtrl,
                                decoration: const InputDecoration(
                                  labelText: 'Full name',
                                  prefixIcon: Icon(Icons.person_outline_rounded, color: Color(0xFF5A5A78)),
                                ),
                                validator: (v) => v?.isEmpty == true ? 'Enter your name' : null,
                              ),
                              const SizedBox(height: 14),
                              TextFormField(
                                controller: _emailCtrl,
                                keyboardType: TextInputType.emailAddress,
                                decoration: const InputDecoration(
                                  labelText: 'Email address',
                                  prefixIcon: Icon(Icons.email_outlined, color: Color(0xFF5A5A78)),
                                ),
                                validator: (v) => v?.isEmpty == true ? 'Enter your email' : null,
                              ),
                              const SizedBox(height: 14),

                              // Password with strength meter
                              ValueListenableBuilder(
                                valueListenable: _passCtrl,
                                builder: (_, __, ___) {
                                  final strength = _passCtrl.text.isEmpty ? 0 : _getPasswordStrength(_passCtrl.text);
                                  final labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
                                  final colors = [Colors.grey, const Color(0xFFFF4757), const Color(0xFFFFAA00), const Color(0xFF06D6A0), const Color(0xFF06D6A0)];
                                  return Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      TextFormField(
                                        controller: _passCtrl,
                                        obscureText: _obscure,
                                        decoration: InputDecoration(
                                          labelText: 'Password',
                                          prefixIcon: const Icon(Icons.lock_outline_rounded, color: Color(0xFF5A5A78)),
                                          suffixIcon: IconButton(
                                            icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                              color: const Color(0xFF5A5A78)),
                                            onPressed: () => setState(() => _obscure = !_obscure),
                                          ),
                                        ),
                                        validator: (v) {
                                          if (v == null || v.isEmpty) return 'Enter a password';
                                          if (v.length < 8) return 'Min. 8 characters';
                                          return null;
                                        },
                                      ),
                                      if (_passCtrl.text.isNotEmpty) ...[
                                        const SizedBox(height: 8),
                                        Row(
                                          children: List.generate(4, (i) => Expanded(
                                            child: Container(
                                              height: 4, margin: const EdgeInsets.only(right: 4),
                                              decoration: BoxDecoration(
                                                color: i < strength ? colors[strength] : const Color(0xFF2A2A40),
                                                borderRadius: BorderRadius.circular(2),
                                              ),
                                            ),
                                          )),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(labels[strength], style: TextStyle(
                                          fontSize: 12, color: colors[strength])),
                                      ],
                                    ],
                                  );
                                },
                              ),

                              const SizedBox(height: 14),
                              TextFormField(
                                controller: _confirmCtrl,
                                obscureText: true,
                                decoration: const InputDecoration(
                                  labelText: 'Confirm password',
                                  prefixIcon: Icon(Icons.lock_outline_rounded, color: Color(0xFF5A5A78)),
                                ),
                                validator: (v) => v?.isEmpty == true ? 'Confirm your password' : null,
                              ),

                              const SizedBox(height: 20),
                              SizedBox(
                                width: double.infinity, height: 54,
                                child: ElevatedButton(
                                  onPressed: _loading || _success != null ? null : _signup,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF7C6FF7),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                  ),
                                  child: _loading
                                    ? const SizedBox(width: 20, height: 20,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                    : Text('Create Account →', style: GoogleFonts.inter(
                                        fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),
                        Center(
                          child: GestureDetector(
                            onTap: () => context.go('/login'),
                            child: RichText(
                              text: TextSpan(
                                style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF8888A8)),
                                children: [
                                  const TextSpan(text: 'Already have an account? '),
                                  TextSpan(text: 'Log in', style: GoogleFonts.inter(
                                    fontSize: 14, color: const Color(0xFF7C6FF7), fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.05),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Alert extends StatelessWidget {
  final String message;
  final bool isError;
  const _Alert({required this.message, required this.isError});

  @override
  Widget build(BuildContext context) {
    final color = isError ? const Color(0xFFFF4757) : const Color(0xFF06D6A0);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(children: [
        Icon(isError ? Icons.error_outline_rounded : Icons.check_circle_outline_rounded,
          color: color, size: 18),
        const SizedBox(width: 10),
        Expanded(child: Text(message, style: GoogleFonts.inter(fontSize: 13, color: color))),
      ]),
    );
  }
}
