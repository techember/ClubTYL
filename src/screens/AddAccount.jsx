import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import COLORS from '../constants/colors';
import Button from '../components/Button';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import { postData } from '../API';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddAccount = () => {
  const navigation = useNavigation();
  const userData = useSelector(state => state.user);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [referralId, setReferralId] = useState(userData?.referalId || '');
  
  const [loading, setLoading] = useState(false);

  const addUser = async () => {
    if (!firstName || !lastName || !email || !phone) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill all fields' });
      return;
    }
    
    setLoading(true);
    try {
      const fcmToken = await AsyncStorage.getItem('fcmToken');
      const payload = {
        firstName,
        lastName,
        email,
        phone,
        deviceToken: fcmToken,
      };
      
      const response = await postData('/api/auth/add-sub-user', payload);
      
      if (response?.Status === true) {
        Alert.alert('Success', 'Account added successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: response?.data?.message || response?.Remarks || 'Failed to add account' });
      }
    } catch (error) {
      console.error('Add User Error:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: error?.response?.data?.Remarks || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Add Account</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>First Name</Text>
        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First Name" />
        
        <Text style={styles.label}>Last Name</Text>
        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last Name" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone Number" keyboardType="phone-pad" maxLength={10} />

        <Text style={styles.label}>Referral ID (Auto-filled)</Text>
        <TextInput style={[styles.input, { backgroundColor: '#f0f0f0' }]} value={referralId} editable={false} />

        <Button 
            title={loading ? <ActivityIndicator color="#fff"/> : "Add Account"} 
            onpress={addUser} 
            style={{ marginTop: 20 }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '600',
    marginLeft: 15,
    color: COLORS.black,
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.black,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: COLORS.black,
    backgroundColor: '#fafafa',
  },
});

export default AddAccount;
