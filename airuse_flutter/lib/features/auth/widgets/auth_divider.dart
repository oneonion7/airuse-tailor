import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AuthDivider extends StatelessWidget {
  final String label;
  const AuthDivider({super.key, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider(color: Color(0xFF1E1E30))),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Text(label, style: GoogleFonts.inter(
            fontSize: 12, color: const Color(0xFF5A5A78),
          )),
        ),
        const Expanded(child: Divider(color: Color(0xFF1E1E30))),
      ],
    );
  }
}
