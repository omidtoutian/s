import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  IconButton,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Send,
  Search,
  Add,
  ArrowBack,
} from '@mui/icons-material';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../../firebase';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

// Temporary PageHeader component
const PageHeader: React.FC<{ title: string; showBack?: boolean }> = ({ 
  title, 
  showBack = true 
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        px: 2,
        py: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {showBack && (
        <IconButton
          onClick={handleBack}
          size={isMobile ? 'small' : 'medium'}
          sx={{ color: 'primary.main' }}
        >
          <ArrowBack />
        </IconButton>
      )}
      <Typography variant={isMobile ? 'h6' : 'h5'} component="h1" fontWeight="bold">
        {title}
      </Typography>
    </Box>
  );
};

interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: any;
  read: boolean;
}

interface Chat {
  id: string;
  participants: string[];
  lastMessage?: {
    text: string;
    timestamp: any;
  };
  user: {
    id: string;
    displayName: string;
    username: string;
    photoURL: string;
  };
}

const Messages: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    // Subscribe to user's chats
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessage.timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      const chatsData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const otherUserId = data.participants.find((id: string) => id !== user.uid);
          const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', otherUserId)));
          const userData = userDoc.docs[0]?.data() || {};

          return {
            id: doc.id,
            ...data,
            user: {
              id: otherUserId,
              displayName: userData.displayName || 'Unknown User',
              username: userData.username || 'unknown',
              photoURL: userData.photoURL || '',
            },
          };
        })
      );
      setChats(chatsData);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (selectedChat) {
      // Subscribe to messages in the selected chat
      const messagesQuery = query(
        collection(db, 'messages'),
        where('chatId', '==', selectedChat.id),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];
        setMessages(messagesData);
        scrollToBottom();
      });

      return () => unsubscribe();
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!user || !selectedChat || !newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'messages'), {
        chatId: selectedChat.id,
        text: newMessage,
        senderId: user.uid,
        receiverId: selectedChat.user.id,
        timestamp: serverTimestamp(),
        read: false,
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('username', '>=', searchQuery),
        where('username', '<=', searchQuery + '\uf8ff')
      );
      const snapshot = await getDocs(usersQuery);
      const results = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.uid !== auth.currentUser?.uid);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const createNewChat = async (otherUser: any) => {
    if (!user) return;

    try {
      const chatDoc = await addDoc(collection(db, 'chats'), {
        participants: [user.uid, otherUser.uid],
        createdAt: serverTimestamp(),
      });

      setSelectedChat({
        id: chatDoc.id,
        participants: [user.uid, otherUser.uid],
        user: {
          id: otherUser.uid,
          displayName: otherUser.displayName,
          username: otherUser.username,
          photoURL: otherUser.photoURL,
        },
      });
      setNewChatOpen(false);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  return (
    <Box 
      sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: 'background.default',
        color: 'text.primary'
      }}
    >
      <PageHeader title={selectedChat ? selectedChat.user.displayName : "Messages"} />
      <Box 
        sx={{ 
          display: 'flex', 
          flexGrow: 1, 
          overflow: 'hidden',
          bgcolor: 'background.paper'
        }}
      >
        {/* Chats List */}
        <Box 
          sx={{ 
            width: 300, 
            borderRight: 1, 
            borderColor: 'divider', 
            display: 'flex', 
            flexDirection: 'column',
            bgcolor: 'background.paper'
          }}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Chats
            </Typography>
            <IconButton onClick={() => setNewChatOpen(true)}>
              <Add />
            </IconButton>
          </Box>
          <Divider />
          <List sx={{ overflow: 'auto', maxHeight: 'calc(80vh - 64px)' }}>
            {chats.map((chat) => (
              <ListItem
                key={chat.id}
                button
                selected={selectedChat?.id === chat.id}
                onClick={() => setSelectedChat(chat)}
              >
                <ListItemAvatar>
                  <Avatar src={chat.user.photoURL} />
                </ListItemAvatar>
                <ListItemText
                  primary={chat.user.displayName}
                  secondary={
                    chat.lastMessage
                      ? `${chat.lastMessage.text.substring(0, 30)}${
                          chat.lastMessage.text.length > 30 ? '...' : ''
                        }`
                      : 'No messages yet'
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Messages Area */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedChat ? (
            <>
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                <IconButton sx={{ mr: 1 }} onClick={() => setSelectedChat(null)}>
                  <ArrowBack />
                </IconButton>
                <Avatar src={selectedChat.user.photoURL} sx={{ mr: 1 }} />
                <Typography variant="subtitle1">
                  {selectedChat.user.displayName}
                </Typography>
              </Box>

              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {messages.map((message) => (
                  <Box
                    key={message.id}
                    sx={{
                      display: 'flex',
                      justifyContent: message.senderId === user?.uid ? 'flex-end' : 'flex-start',
                      mb: 1,
                    }}
                  >
                    <Paper
                      sx={{
                        p: 1,
                        maxWidth: '70%',
                        bgcolor: message.senderId === user?.uid 
                          ? 'primary.main' 
                          : 'background.paper',
                        color: message.senderId === user?.uid 
                          ? 'primary.contrastText' 
                          : 'text.primary',
                        borderRadius: 2,
                        boxShadow: 2
                      }}
                    >
                      <Typography variant="body1">{message.text}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {moment(message.timestamp?.toDate()).format('LT')}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>

              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <TextField
                  fullWidth
                  placeholder="Type a message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleSendMessage}>
                          <Send />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </>
          ) : (
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography color="text.secondary">
                Select a chat or start a new conversation
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* New Chat Dialog */}
      <Dialog 
        open={newChatOpen} 
        onClose={() => setNewChatOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary'
          }
        }}
      >
        <DialogTitle>New Message</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search users"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyUp={() => handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <List>
            {searchResults.map((user) => (
              <ListItem
                key={user.id}
                button
                onClick={() => createNewChat(user)}
              >
                <ListItemAvatar>
                  <Avatar src={user.photoURL} />
                </ListItemAvatar>
                <ListItemText
                  primary={user.displayName}
                  secondary={`@${user.username}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewChatOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Messages;
