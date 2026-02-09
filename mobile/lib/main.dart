import 'package:flutter/material.dart';
import 'screens/auth_screen.dart';

void main() {
  runApp(const YapItApp());
}

class YapItApp extends StatelessWidget {
  const YapItApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'YapIt',
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: ColorScheme.dark(
          primary: Color(0xFF2563eb),
          secondary: Color(0xFF1f2937),
        ),
      ),
      home: AuthScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}
