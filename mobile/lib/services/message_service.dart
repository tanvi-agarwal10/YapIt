import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/message.dart';
import 'auth_service.dart';

const String baseUrl = 'http://localhost:5000/api';

class MessageService {
  static Future<List<Message>> getMessages(String otherUserId) async {
    try {
      final token = await AuthService.getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/messages/$otherUserId'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return (data['messages'] as List).map((m) => Message.fromJson(m)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching messages: $e');
      return [];
    }
  }

  static Future<bool> sendMessage({
    required String receiverId,
    required String content,
  }) async {
    try {
      final token = await AuthService.getToken();
      final response = await http.post(
        Uri.parse('$baseUrl/messages/send'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'receiverId': receiverId,
          'content': content,
        }),
      );

      return response.statusCode == 201;
    } catch (e) {
      print('Error sending message: $e');
      return false;
    }
  }
}
