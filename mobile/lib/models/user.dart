class User {
  final String id;
  final String username;
  final String email;
  final bool isOnline;
  final DateTime lastSeen;

  User({
    required this.id,
    required this.username,
    required this.email,
    required this.isOnline,
    required this.lastSeen,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? json['_id'] ?? '',
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      isOnline: json['isOnline'] ?? false,
      lastSeen: DateTime.parse(json['lastSeen'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'isOnline': isOnline,
      'lastSeen': lastSeen.toIso8601String(),
    };
  }
}
