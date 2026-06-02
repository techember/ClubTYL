import {Text, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import React from 'react';
import COLORS from '../constants/colors';

const Button = props => {
  const filledBgColor = props.color || COLORS.primary;
  const outlinedColor = COLORS.white;
  const bgColor = props.filled ? filledBgColor : outlinedColor;
  const textColor = props.filled ? COLORS.white : COLORS.primary;
  const hasShadow = props.filled ? styles.shadow : {};

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.button,
        {backgroundColor: bgColor},
        hasShadow,
        props.style,
      ]}
      onPress={props.onpress}>
      <Text style={{fontSize: 18, fontWeight: '600', color: textColor}}>{props.title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadow: {
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
        shadowColor: COLORS.primary,
      },
    }),
  }
});
export default Button;
