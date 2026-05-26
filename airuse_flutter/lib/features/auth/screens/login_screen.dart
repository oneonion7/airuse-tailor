import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../widgets/auth_card.dart';
import '../widgets/google_sign_in_button.dart';
import '../widgets/auth_divider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  String? _error;

  final _supabase = Supabase.instance.client;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _loginWithEmail() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });
    try {
      await _supabase.auth.signInWithPassword(
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
      );
      if (mounted) context.go('/dashboard');
    } on AuthException catch (e) {
      setState(() { _error = e.message; _loading = false; });
    } catch (e) {
      setState(() { _error = 'Login failed. Please try again.'; _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background orbs
          Positioned(top: -120, right: -80,
            child: Container(width: 400, height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF7C6FF7).withOpacity(0.12),
              ))),
          Positioned(bottom: -100, left: -60,
            child: Container(width: 350, height: 350,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF06D6A0).withOpacity(0.07),
              ))),

          SafeArea(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    // Back + Logo row
                    Row(
                      children: [
                        GestureDetector(
                          onTap: () => context.go('/'),
                          child: const Icon(Icons.arrow_back_ios_new_rounded,
                            color: Color(0xFF8888A8), size: 20),
                        ),
                        const Spacer(),
                        _LogoBadge(),
                        const Spacer(),
                        const SizedBox(width: 20),
                      ],
                    ).animate().fadeIn(duration: 400.ms),

                    const SizedBox(height: 40),

                    AuthCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Welcome back 👋',
                            style: GoogleFonts.inter(
                              fontSize: 26, fontWeight: FontWeight.w700, color: Colors.white,
                            )),
                          const SizedBox(height: 6),
                          Text('Log in to access your saved resumes',
                            style: GoogleFonts.inter(
                              fontSize: 14, color: const Color(0xFF8888A8),
                            )),
                          const SizedBox(height: 28),

                          // Error alert
                          if (_error != null) ...[
                            _ErrorAlert(message: _error!),
                            const SizedBox(height: 16),
                          ],

                          // Google Sign In
                          GoogleSignInButton(
                            label: 'Continue with Google',
                            redirectTo: 'https://airuse-tailor-4pej.vercel.app/dashboard',
                          ),

                          const SizedBox(height: 20),
                          const AuthDivider(label: 'or sign in with email'),
                          const SizedBox(height: 20),

                          // Email/Password form
                          Form(
                            key: _formKey,
                            child: Column(
                              children: [
                                TextFormField(
                                  controller: _emailCtrl,
                                  keyboardType: TextInputType.emailAddress,
                                  decoration: const InputDecoration(
                                    labelText: 'Email address',
                                    prefixIcon: Icon(Icons.email_outlined, color: Color(0xFF5A5A78)),
                                  ),
                                  validator: (v) => v?.isEmpty == true ? 'Enter your email' : null,
                                ),
                                const SizedBox(height: 16),
                                TextFormField(
                                  controller: _passCtrl,
                                  obscureText: _obscure,
                                  decoration: InputDecoration(
                                    labelText: 'Password',
                                    prefixIcon: const Icon(Icons.lock_outline_rounded, color: Color(0xFF5A5A78)),
                                    suffixIcon: IconButton(
                                      icon: Icon(
                                        _obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                                        color: const Color(0xFF5A5A78),
                                      ),
                                      onPressed: () => setState(() => _obscure = !_obscure),
                                    ),
                                  ),
                                  validator: (v) => v?.isEmpty == true ? 'Enter your password' : null,
                                ),

                                Align(
                                  alignment: Alignment.centerRight,
                                  child: TextButton(
                                    onPressed: () {},
                                    child: Text('Forgot password?',
                                      style: GoogleFonts.inter(
                                        fontSize: 13, color: const Color(0xFF7C6FF7),
                                      )),
                                  ),
                                ),

                                const SizedBox(height: 8),
                                SizedBox(
                                  width: double.infinity,
                                  height: 54,
                                  child: ElevatedButton(
                                    onPressed: _loading ? null : _loginWithEmail,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF7C6FF7),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                    ),
                                    child: _loading
                                      ? const SizedBox(width: 20, height: 20,
                                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                      : Text('Log In →', style: GoogleFonts.inter(
                                          fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 24),
                          Center(
                            child: RichText(
                              text: TextSpan(
                                style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF8888A8)),
                                children: [
                                  const TextSpan(text: "Don't have an account? "),
                                  WidgetSpan(
                                    child: GestureDetector(
                                      onTap: () => context.go('/signup'),
                                      child: Text('Sign up free',
                                        style: GoogleFonts.inter(
                                          fontSize: 14, color: const Color(0xFF7C6FF7),
                                          fontWeight: FontWeight.w600,
                                        )),
                                    ),
                                  ),
                                ],
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
          ),
        ],
      ),
    );
  }
}

class _LogoBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(children: [
        TextSpan(text: 'Air', style: GoogleFonts.inter(
          fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
        TextSpan(text: 'Use', style: GoogleFonts.inter(
          fontSize: 20, fontWeight: FontWeight.w800, color: const Color(0xFF7C6FF7))),
      ]),
    );
  }
}

class _ErrorAlert extends StatelessWidget {
  final String message;
  const _ErrorAlert({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFF4757).withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFF4757).withOpacity(0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: Color(0xFFFF4757), size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(message, style: GoogleFonts.inter(
              fontSize: 13, color: const Color(0xFFFF4757),
            )),
          ),
        ],
      ),
    );
  }
}
