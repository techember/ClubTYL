import React, { useEffect, useState } from 'react';
import { TextInput, Text, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import COLORS from '../constants/colors';
import Button from '../components/Button';
import Toast from 'react-native-toast-message';
import { useNavigation, useRoute } from '@react-navigation/native';
import { URL } from '../constants/URL';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { postData } from '../API';

const CreatePassword = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { email } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(true);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    const addEmailToStorage = async () => {
      try {
        await AsyncStorage.setItem('email', email);
      } catch (error) {
        console.error('Error adding email to AsyncStorage:', error);
      }
    };
    addEmailToStorage();
  }, [email]);

  const validatePassword = value => {
    return value.length >= 6; // At least 6 characters
  };

  const handleSubmit = async () => {
    if (!validatePassword(password)) {
      setErrorText('Password must be at least 6 characters');
      Toast.show({
        type: 'error',
        text1: 'Invalid Password',
        text2: 'Password must be at least 6 characters',
      });
      return;
    }

    if (password !== confirmPassword) {
      setErrorText('Passwords do not match');
      Toast.show({
        type: 'error',
        text1: 'Mismatch',
        text2: 'Both passwords must match',
      });
      return;
    }

    try {
      const response = await postData(`/api/user/set-password`, {
        password: password,
      });
      console.log(response);
      if (response.Remarks === "Password set successfully.") {
        navigation.navigate('CreateMpin');
      } else {
        setErrorText(response.data.message);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: `${response.data.message}`,
        });
      }
    } catch (error) {
      console.error(error);
      setErrorText('An unexpected error occurred. Please try again.');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: `Something went wrong`,
      });
    }
  };

  return (
    <View
      style={{
        marginHorizontal: 22,
        marginTop: 22,
      }}
    >
      <View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={24} color={COLORS.black} />
        </TouchableOpacity>

        <Text
          style={{
            marginTop: -28,
            fontSize: 22,
            fontWeight: '500',
            color: COLORS.black,
            alignSelf: 'center',
          }}
        >
          Create Password
        </Text>
      </View>

      {/* Password */}
      <View
        style={{
          marginTop: 22,
          marginBottom: 32,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '400',
            color: COLORS.black,
          }}
        >
          Password
        </Text>

        <View
          style={{
            width: '100%',
            height: 48,
            borderWidth: 2,
            borderColor: COLORS.primary,
            borderRadius: 8,
          }}
        >
          <TextInput
            secureTextEntry={isPasswordVisible}
            placeholder="Enter password"
            value={password}
            onChangeText={text => setPassword(text)}
            style={{
              fontSize: 16,
              fontWeight: '400',
              width: '100%',
              paddingLeft: 10,
            }}
          />

          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={{
              position: 'absolute',
              right: 12,
              top: 10,
            }}
          >
            {isPasswordVisible ? (
              <Icon name="eye" size={24} color={COLORS.primary} />
            ) : (
              <Icon name="eye-slash" size={24} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>

        <Text style={{ marginTop: 4 }}>Must be at least 6 characters</Text>
      </View>

      {/* Confirm Password */}
      <View style={{ marginBottom: 32 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '400',
            color: COLORS.black,
          }}
        >
          Confirm Password
        </Text>

        <View
          style={{
            width: '100%',
            height: 48,
            borderWidth: 2,
            borderColor: COLORS.primary,
            borderRadius: 8,
          }}
        >
          <TextInput
            secureTextEntry={isConfirmPasswordVisible}
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={text => setConfirmPassword(text)}
            style={{
              fontSize: 16,
              fontWeight: '400',
              width: '100%',
              paddingLeft: 10,
            }}
          />

          <TouchableOpacity
            onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
            style={{
              position: 'absolute',
              right: 12,
              top: 10,
            }}
          >
            {isConfirmPasswordVisible ? (
              <Icon name="eye" size={24} color={COLORS.primary} />
            ) : (
              <Icon name="eye-slash" size={24} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Button
        onpress={handleSubmit}
        style={{
          marginTop: 350,
        }}
        title="Confirm"
        filled
      />
    </View>
  );
};

export default CreatePassword;
