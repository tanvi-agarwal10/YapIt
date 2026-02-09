import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/user.dart';

const String baseUrl = 'http://localhost:5000/api';

class AuthService {
  static Future<Map<String, dynamic>> register({
    required String username,
    required String email,
    required String password,
    required String confirmPassword,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'email': email,
          'password': password,
          'confirmPassword': confirmPassword,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        await _saveToken(data['token']);
        return {'success': true, 'user': User.fromJson(data['user']), 'token': data['token']};
      } else {
        return {'success': false, 'message': jsonDecode(response.body)['message']};
      }
    } catch (e) {
      return {'success': false, 'message': 'Registration error: $e'};
    }
  }

  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await _saveToken(data['token']);
        return {'success': true, 'user': User.fromJson(data['user']), 'token': data['token']};
      } else {
        return {'success': false, 'message': jsonDecode(response.body)['message']};
      }
    } catch (e) {
      return {'success': false, 'message': 'Login error: $e'};
    }
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  static Future<List<User>> getAllUsers() async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/auth/users'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return (data['users'] as List).map((u) => User.fromJson(u)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching users: $e');
      return [];
    }
  }
}
