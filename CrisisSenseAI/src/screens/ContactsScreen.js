import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { MOCK_CONTACTS } from '../constants/mockData';

const CONTACTS_STORAGE_KEY = '@emergency_contacts';

export const ContactsScreen = () => {
  const [contacts, setContacts] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const storedContacts = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
      if (storedContacts !== null) {
        setContacts(JSON.parse(storedContacts));
      } else {
        // Fallback to initial mock contacts if nothing is stored
        setContacts(MOCK_CONTACTS);
        await saveContacts(MOCK_CONTACTS);
      }
    } catch (e) {
      console.error('Failed to load contacts', e);
    }
  };

  const saveContacts = async (newContacts) => {
    try {
      await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(newContacts));
      setContacts(newContacts);
    } catch (e) {
      console.error('Failed to save contacts', e);
    }
  };

  const handleSaveContact = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Name and phone number correspond to an emergency contact and cannot be empty.');
      return;
    }

    let updatedContacts = [...contacts];

    if (editingContact) {
      // Update existing
      updatedContacts = updatedContacts.map(c => 
        c.id === editingContact.id ? { ...c, name, phone } : c
      );
    } else {
      // Add new
      updatedContacts.push({
        id: Date.now().toString(),
        name,
        phone
      });
    }

    saveContacts(updatedContacts);
    closeModal();
  };

  const handleDeleteContact = (id) => {
    Alert.alert('Delete Contact', 'Are you sure you want to remove this emergency contact?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: () => {
          const updatedContacts = contacts.filter(c => c.id !== id);
          saveContacts(updatedContacts);
        }
      }
    ]);
  };

  const openModal = (contact = null) => {
    if (contact) {
      setEditingContact(contact);
      setName(contact.name);
      setPhone(contact.phone);
    } else {
      setEditingContact(null);
      setName('');
      setPhone('');
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingContact(null);
    setName('');
    setPhone('');
  };

  const renderContactItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.phone}>{item.phone}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openModal(item)}>
          <Ionicons name="pencil" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteContact(item.id)}>
          <Ionicons name="trash" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Contacts</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContactItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No emergency contacts added yet.</Text>
        }
      />

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingContact ? 'Edit Contact' : 'Add Contact'}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Full Name (e.g., Mom)"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveContact}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background, 
    padding: theme.spacing.large 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.xl
  },
  title: { 
    color: theme.colors.textPrimary, 
    fontSize: theme.typography.sizes.heading, 
    fontWeight: 'bold', 
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: theme.spacing.xxl,
  },
  card: { 
    backgroundColor: theme.colors.surface, 
    padding: theme.spacing.large, 
    borderRadius: theme.borderRadius.card, 
    marginBottom: theme.spacing.medium,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardContent: {
    flex: 1,
  },
  name: { 
    color: theme.colors.textPrimary, 
    fontSize: theme.typography.sizes.subtitle, 
    fontWeight: 'bold' 
  },
  phone: { 
    color: theme.colors.textSecondary, 
    marginTop: theme.spacing.xs 
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.small,
  },
  actionBtn: {
    padding: theme.spacing.small,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    fontSize: theme.typography.sizes.body
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: theme.spacing.large,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.card,
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sizes.title,
    fontWeight: 'bold',
    marginBottom: theme.spacing.large,
    textAlign: 'center'
  },
  input: {
    backgroundColor: theme.colors.background,
    color: theme.colors.textPrimary,
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.card,
    marginBottom: theme.spacing.medium,
    fontSize: theme.typography.sizes.body,
    borderWidth: 1,
    borderColor: '#333'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.medium,
    gap: theme.spacing.medium
  },
  cancelButton: {
    flex: 1,
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.button,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.textSecondary
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: 'bold'
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.button,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold'
  }
});
