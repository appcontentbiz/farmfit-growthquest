import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Voice from 'react-native-voice';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SpeechToTextScreen = () => {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState('');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load saved notes
    loadNotes();

    // Initialize voice recognition
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const loadNotes = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('farmNotes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
    } catch (e) {
      setError('Error loading notes');
    }
  };

  const saveNote = async (noteText) => {
    try {
      const timestamp = new Date().toISOString();
      const newNote = {
        id: timestamp,
        text: noteText,
        timestamp,
      };
      const updatedNotes = [newNote, ...notes];
      await AsyncStorage.setItem('farmNotes', JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
      setText('');
    } catch (e) {
      setError('Error saving note');
    }
  };

  const deleteNote = async (noteId) => {
    try {
      const updatedNotes = notes.filter((note) => note.id !== noteId);
      await AsyncStorage.setItem('farmNotes', JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
    } catch (e) {
      setError('Error deleting note');
    }
  };

  const onSpeechStart = () => {
    setIsListening(true);
    setError('');
  };

  const onSpeechEnd = () => {
    setIsListening(false);
  };

  const onSpeechResults = (event) => {
    setText(event.value[0]);
  };

  const onSpeechError = (error) => {
    setError('Error recording voice');
    setIsListening(false);
  };

  const startListening = async () => {
    try {
      await Voice.start('en-US');
    } catch (e) {
      setError('Error starting voice recognition');
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      setError('Error stopping voice recognition');
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.notesContainer}>
        {notes.map((note) => (
          <View key={note.id} style={styles.noteItem}>
            <View style={styles.noteContent}>
              <Text style={styles.noteText}>{note.text}</Text>
              <Text style={styles.timestamp}>{formatDate(note.timestamp)}</Text>
            </View>
            <TouchableOpacity
              onPress={() => deleteNote(note.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={24} color="#ff0000" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.recordedText}>{text}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={isListening ? stopListening : startListening}
            style={[
              styles.recordButton,
              isListening && styles.recordingButton,
            ]}
          >
            <Ionicons
              name={isListening ? 'stop-circle' : 'mic'}
              size={32}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => text && saveNote(text)}
            style={[styles.saveButton, !text && styles.disabledButton]}
            disabled={!text}
          >
            <Ionicons name="save-outline" size={32} color="#fff" />
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  notesContainer: {
    flex: 1,
    padding: 15,
  },
  noteItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  noteContent: {
    flex: 1,
  },
  noteText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 5,
  },
  inputContainer: {
    backgroundColor: '#fff',
    padding: 15,
    elevation: 5,
  },
  textContainer: {
    minHeight: 60,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  recordedText: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  recordButton: {
    backgroundColor: '#4CAF50',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#f44336',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  errorText: {
    color: '#f44336',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default SpeechToTextScreen;
