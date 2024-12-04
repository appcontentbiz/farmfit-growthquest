import React from 'react';
import { StyleSheet, Animated } from 'react-native';
import { FAB, useTheme } from 'react-native-paper';

interface AnimatedFABProps {
  icon: string;
  label: string;
  onPress: () => void;
  extended: boolean;
  visible: boolean;
  animateFrom: 'right' | 'left';
  iconMode?: 'static' | 'dynamic';
  style?: any;
}

const AnimatedFAB = ({
  icon,
  label,
  onPress,
  extended,
  visible,
  animateFrom,
  iconMode,
  style,
}: AnimatedFABProps) => {
  const theme = useTheme();
  const [animatedFAB] = React.useState({
    scale: new Animated.Value(visible ? 1 : 0),
    opacity: new Animated.Value(visible ? 1 : 0),
  });

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(animatedFAB.scale, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(animatedFAB.opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(animatedFAB.scale, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(animatedFAB.opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, animatedFAB.scale, animatedFAB.opacity]);

  const fabStyle = { ...styles.fab };
  if (animateFrom === 'right') {
    fabStyle.right = 16;
  } else {
    fabStyle.left = 16;
  }

  return (
    <Animated.View
      style={[
        fabStyle,
        {
          transform: [{ scale: animatedFAB.scale }],
          opacity: animatedFAB.opacity,
        },
        style,
      ]}
    >
      <FAB
        icon={icon}
        label={extended ? label : undefined}
        onPress={onPress}
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
          },
        ]}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 16,
    margin: 16,
  },
});

export default AnimatedFAB;
