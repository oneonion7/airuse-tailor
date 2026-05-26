import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';

const String supabaseUrl = 'https://xlcnkjzczobpoopyavmd.supabase.co';
const String supabaseAnonKey = 'sb_publishable_or_gpfHZ5_dkIndoWT8zCQ_n_8FmWs7';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    authOptions: const FlutterAuthClientOptions(
      authFlowType: AuthFlowType.pkce,
    ),
  );

  runApp(const AirUseApp());
}

class AirUseApp extends StatelessWidget {
  const AirUseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'AirUse — AI Resume Tailor',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark(),
      routerConfig: AppRouter.router,
    );
  }
}
