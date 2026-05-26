import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/signup_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/builder/screens/builder_screen.dart';
import '../../features/landing/screens/landing_screen.dart';
import '../../features/auth/screens/auth_callback_screen.dart';

class AppRouter {
  static final _supabase = Supabase.instance.client;

  static final GoRouter router = GoRouter(
    initialLocation: '/',
    redirect: (context, state) async {
      final session = _supabase.auth.currentSession;
      final isAuth = session != null;
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/signup' ||
          state.matchedLocation == '/';

      if (!isAuth && !isAuthRoute && state.matchedLocation != '/auth/callback') {
        return '/login';
      }
      if (isAuth && isAuthRoute) {
        return '/dashboard';
      }
      return null;
    },
    routes: [
      GoRoute(path: '/',          builder: (ctx, _) => const LandingScreen()),
      GoRoute(path: '/login',     builder: (ctx, _) => const LoginScreen()),
      GoRoute(path: '/signup',    builder: (ctx, _) => const SignupScreen()),
      GoRoute(path: '/dashboard', builder: (ctx, _) => const DashboardScreen()),
      GoRoute(path: '/builder',   builder: (ctx, _) => const BuilderScreen()),
      GoRoute(path: '/auth/callback', builder: (ctx, _) => const AuthCallbackScreen()),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(child: Text('Page not found: ${state.error}')),
    ),
  );
}
