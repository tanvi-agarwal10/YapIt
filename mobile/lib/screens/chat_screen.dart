import 'package:flutter/material.dart';
import '../models/user.dart';
import '../models/message.dart';
import '../services/auth_service.dart';
import '../services/message_service.dart';
import '../services/socket_service.dart';
import 'auth_screen.dart';

class ChatScreen extends StatefulWidget {
  final User user;

  const ChatScreen({required this.user});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  List<User> users = [];
  User? selectedUser;
  List<Message> messages = [];
  final messageController = TextEditingController();
  bool isLoading = false;
  bool isSocketConnected = false;
  Set<String> onlineUsers = {};

  @override
  void initState() {
    super.initState();
    loadUsers();
    initializeSocket();
  }

  Future<void> loadUsers() async {
    final allUsers = await AuthService.getAllUsers();
    setState(() {
      users = allUsers.where((u) => u.id != widget.user.id).toList();
    });
  }

  Future<void> initializeSocket() async {
    try {
      await SocketService.connect(widget.user.id);
      setState(() => isSocketConnected = true);

      SocketService.onMessageReceive((data) {
        if (selectedUser?.id == data['senderId']) {
          setState(() {
            messages.add(Message(
              id: data['id'] ?? '',
              senderId: data['senderId'],
              receiverId: widget.user.id,
              content: data['content'],
              timestamp: DateTime.parse(data['timestamp'] ?? DateTime.now().toIso8601String()),
            ));
          });
        }
      });

      SocketService.onUserOnline((userId) {
        setState(() => onlineUsers.add(userId));
      });

      SocketService.onUserOffline((userId) {
        setState(() => onlineUsers.remove(userId));
      });
    } catch (e) {
      print('Socket initialization error: $e');
    }
  }

  Future<void> selectUser(User user) async {
    setState(() => selectedUser = user);
    final msgs = await MessageService.getMessages(user.id);
    setState(() => messages = msgs);
  }

  Future<void> sendMessage() async {
    if (messageController.text.isEmpty || selectedUser == null) return;

    final content = messageController.text;
    messageController.clear();

    setState(() {
      messages.add(Message(
        id: DateTime.now().toString(),
        senderId: widget.user.id,
        receiverId: selectedUser!.id,
        content: content,
        timestamp: DateTime.now(),
      ));
    });

    SocketService.sendMessage(widget.user.id, selectedUser!.id, content);
    await MessageService.sendMessage(receiverId: selectedUser!.id, content: content);
  }

  Future<void> logout() async {
    await AuthService.logout();
    SocketService.disconnect(widget.user.id);
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => AuthScreen()),
      );
    }
  }

  @override
  void dispose() {
    messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        color: Color(0xFF1f2937),
        child: Row(
          children: [
            // Sidebar
            Container(
              width: 300,
              decoration: BoxDecoration(
                color: Color(0xFF1f2937),
                border: Border(right: BorderSide(color: Colors.grey[800]!)),
              ),
              child: Column(
                children: [
                  Padding(
                    padding: EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'YapIt',
                          style: TextStyle(
                            color: Color(0xFF2563eb),
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          onPressed: logout,
                          icon: Icon(Icons.logout, color: Colors.red),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: EdgeInsets.all(16),
                    child: Container(
                      padding: EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Color(0xFF2d3748),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Status',
                            style: TextStyle(color: Colors.grey[400], fontSize: 12),
                          ),
                          SizedBox(height: 5),
                          Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: isSocketConnected ? Colors.green : Colors.red,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              SizedBox(width: 8),
                              Text(
                                isSocketConnected ? 'Online' : 'Offline',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  Expanded(
                    child: ListView.builder(
                      itemCount: users.length,
                      itemBuilder: (context, index) {
                        final user = users[index];
                        final isSelected = selectedUser?.id == user.id;
                        final isOnline = onlineUsers.contains(user.id);

                        return ListTile(
                          selected: isSelected,
                          selectedTileColor: Color(0xFF2563eb).withOpacity(0.2),
                          onTap: () => selectUser(user),
                          leading: Stack(
                            children: [
                              CircleAvatar(
                                backgroundColor: Color(0xFF2563eb),
                                child: Text(user.username[0].toUpperCase()),
                              ),
                              if (isOnline)
                                Positioned(
                                  bottom: 0,
                                  right: 0,
                                  child: Container(
                                    width: 12,
                                    height: 12,
                                    decoration: BoxDecoration(
                                      color: Colors.green,
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Color(0xFF1f2937), width: 2),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          title: Text(
                            user.username,
                            style: TextStyle(color: Colors.white),
                          ),
                          subtitle: Text(
                            isOnline ? '● Online' : '● Offline',
                            style: TextStyle(
                              color: isOnline ? Colors.green : Colors.grey,
                              fontSize: 12,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
            // Chat Window
            Expanded(
              child: Container(
                color: Color(0xFF111827),
                child: selectedUser == null
                    ? Center(
                        child: Text(
                          'Select a user to start chatting',
                          style: TextStyle(color: Colors.grey[400]),
                        ),
                      )
                    : Column(
                        children: [
                          // Chat Header
                          Container(
                            padding: EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Color(0xFF1f2937),
                              border: Border(bottom: BorderSide(color: Colors.grey[800]!)),
                            ),
                            child: Row(
                              children: [
                                Stack(
                                  children: [
                                    CircleAvatar(
                                      backgroundColor: Color(0xFF2563eb),
                                      child: Text(selectedUser!.username[0].toUpperCase()),
                                    ),
                                    if (onlineUsers.contains(selectedUser!.id))
                                      Positioned(
                                        bottom: 0,
                                        right: 0,
                                        child: Container(
                                          width: 12,
                                          height: 12,
                                          decoration: BoxDecoration(
                                            color: Colors.green,
                                            shape: BoxShape.circle,
                                            border: Border.all(
                                              color: Color(0xFF1f2937),
                                              width: 2,
                                            ),
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                SizedBox(width: 12),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      selectedUser!.username,
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    Text(
                                      onlineUsers.contains(selectedUser!.id)
                                          ? '● Online'
                                          : '● Offline',
                                      style: TextStyle(
                                        color: onlineUsers.contains(selectedUser!.id)
                                            ? Colors.green
                                            : Colors.grey,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          // Messages
                          Expanded(
                            child: ListView.builder(
                              reverse: true,
                              itemCount: messages.length,
                              itemBuilder: (context, index) {
                                final message = messages[messages.length - 1 - index];
                                final isOwn = message.senderId == widget.user.id;

                                return Align(
                                  alignment: isOwn
                                      ? Alignment.centerRight
                                      : Alignment.centerLeft,
                                  child: Container(
                                    margin: EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 4,
                                    ),
                                    padding: EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: isOwn
                                          ? Color(0xFF2563eb)
                                          : Color(0xFF4b5563),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          message.content,
                                          style: TextStyle(color: Colors.white),
                                        ),
                                        SizedBox(height: 4),
                                        Text(
                                          message.timestamp.toString().split('.')[0],
                                          style: TextStyle(
                                            color: Colors.grey[300],
                                            fontSize: 10,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                          // Input
                          Container(
                            padding: EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              border: Border(
                                top: BorderSide(color: Colors.grey[800]!),
                              ),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: messageController,
                                    style: TextStyle(color: Colors.white),
                                    decoration: InputDecoration(
                                      hintText: 'Type a message...',
                                      hintStyle: TextStyle(
                                        color: Colors.grey[500],
                                      ),
                                      filled: true,
                                      fillColor: Color(0xFF4b5563),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8),
                                        borderSide: BorderSide.none,
                                      ),
                                      contentPadding: EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 10,
                                      ),
                                    ),
                                  ),
                                ),
                                SizedBox(width: 8),
                                FloatingActionButton(
                                  onPressed: isSocketConnected
                                      ? sendMessage
                                      : null,
                                  backgroundColor: Color(0xFF2563eb),
                                  child: Icon(Icons.send),
                                  mini: true,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
