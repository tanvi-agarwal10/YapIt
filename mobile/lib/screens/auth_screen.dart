import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/auth_service.dart';
import 'chat_screen.dart';

class AuthScreen extends StatefulWidget {
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool isLogin = true;
  bool isLoading = false;
  String? error;

  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final usernameController = TextEditingController();
  final confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    usernameController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> handleSubmit() async {
    setState(() {
      isLoading = true;
      error = null;
    });

    try {
      Map<String, dynamic> result;

      if (isLogin) {
        result = await AuthService.login(
          email: emailController.text,
          password: passwordController.text,
        );
      } else {
        result = await AuthService.register(
          username: usernameController.text,
          email: emailController.text,
          password: passwordController.text,
          confirmPassword: confirmPasswordController.text,
        );
      }

      if (result['success']) {
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (context) => ChatScreen(user: result['user'])),
          );
        }
      } else {
        setState(() => error = result['message']);
      }
    } catch (e) {
      setState(() => error = 'Error: $e');
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF1f2937), Color(0xFF111827)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(height: 50),
                  Text(
                    'YapIt',
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                          color: Color(0xFF2563eb),
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  SizedBox(height: 10),
                  Text(
                    'Real-time Messaging',
                    style: TextStyle(color: Colors.grey[400], fontSize: 16),
                  ),
                  SizedBox(height: 50),
                  if (error != null)
                    Container(
                      padding: EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.2),
                        border: Border.all(color: Colors.red),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(error!, style: TextStyle(color: Colors.red[200])),
                    ),
                  SizedBox(height: 20),
                  if (!isLogin)
                    TextField(
                      controller: usernameController,
                      style: TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'Username',
                        hintStyle: TextStyle(color: Colors.grey[500]),
                        filled: true,
                        fillColor: Color(0xFF4b5563),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  if (!isLogin) SizedBox(height: 15),
                  TextField(
                    controller: emailController,
                    style: TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Email',
                      hintStyle: TextStyle(color: Colors.grey[500]),
                      filled: true,
                      fillColor: Color(0xFF4b5563),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                  SizedBox(height: 15),
                  TextField(
                    controller: passwordController,
                    obscureText: true,
                    style: TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Password',
                      hintStyle: TextStyle(color: Colors.grey[500]),
                      filled: true,
                      fillColor: Color(0xFF4b5563),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                  if (!isLogin) SizedBox(height: 15),
                  if (!isLogin)
                    TextField(
                      controller: confirmPasswordController,
                      obscureText: true,
                      style: TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'Confirm Password',
                        hintStyle: TextStyle(color: Colors.grey[500]),
                        filled: true,
                        fillColor: Color(0xFF4b5563),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  SizedBox(height: 25),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: isLoading ? null : handleSubmit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(0xFF2563eb),
                        padding: EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: Text(
                        isLoading ? 'Loading...' : (isLogin ? 'Login' : 'Register'),
                        style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        isLogin ? "Don't have an account? " : 'Already have an account? ',
                        style: TextStyle(color: Colors.grey[400]),
                      ),
                      GestureDetector(
                        onTap: () => setState(() => isLogin = !isLogin),
                        child: Text(
                          isLogin ? 'Register' : 'Login',
                          style: TextStyle(
                            color: Color(0xFF2563eb),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 50),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
