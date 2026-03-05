/* global require, module */
// Manual mock for react-native-reanimated
// Needed because the official mock.js in v4.x imports react-native-worklets (native) at init time
const React = require('react');
const { View, Text, ScrollView, FlatList, Image } = require('react-native');

// Shared value: mutable container
const useSharedValue = (initial) => {
  const ref = { value: initial };
  return ref;
};

// Animated style: call the worklet synchronously and return plain style
const useAnimatedStyle = (fn) => {
  try {
    return fn() || {};
  } catch {
    return {};
  }
};

// Animation builders: just return the target value
const withTiming = (value) => value;
const withSpring = (value) => value;
const withRepeat = (animation) => animation;
const withSequence = (...animations) => animations[animations.length - 1] ?? 0;
const withDecay = (config) => config.velocity ?? 0;

// runOnJS: no-op wrapper — returns the function itself
const runOnJS = (fn) => fn;

// interpolate: basic linear interpolation
const interpolate = (value, inputRange, outputRange) => {
  const [inMin, inMax] = inputRange;
  const [outMin, outMax] = outputRange;
  const ratio = (value - inMin) / (inMax - inMin);
  return outMin + ratio * (outMax - outMin);
};

// Easing: identity stubs
const Easing = {
  linear: (t) => t,
  quad: (t) => t * t,
  cubic: (t) => t * t * t,
  sin: (t) => t,
  circle: (t) => t,
  exp: (t) => t,
  elastic: () => (t) => t,
  back: () => (t) => t,
  bounce: (t) => t,
  bezier: () => (t) => t,
  out: (fn) => fn,
  in: (fn) => fn,
  inOut: (fn) => fn,
  poly: () => (t) => t,
};

// Animated namespace with wrapped RN components
const Animated = {
  View: React.forwardRef((props, ref) => React.createElement(View, { ...props, ref })),
  Text: React.forwardRef((props, ref) => React.createElement(Text, { ...props, ref })),
  ScrollView: React.forwardRef((props, ref) => React.createElement(ScrollView, { ...props, ref })),
  FlatList: React.forwardRef((props, ref) => React.createElement(FlatList, { ...props, ref })),
  Image: React.forwardRef((props, ref) => React.createElement(Image, { ...props, ref })),
  createAnimatedComponent: (Component) =>
    React.forwardRef((props, ref) => React.createElement(Component, { ...props, ref })),
};

// Layout animations (no-op stubs)
const FadeIn = { duration: () => FadeIn };
const FadeOut = { duration: () => FadeOut };
const SlideInRight = { duration: () => SlideInRight };
const SlideOutRight = { duration: () => SlideOutRight };
const Layout = { duration: () => Layout };
const ZoomIn = { duration: () => ZoomIn };
const ZoomOut = { duration: () => ZoomOut };
const LinearTransition = {};
const ReduceMotionConfig = {};
const ReduceMotion = { Never: 'never', Always: 'always', System: 'system' };

// useAnimatedScrollHandler: returns a no-op handler
const useAnimatedScrollHandler = () => ({});

// useAnimatedRef
const useAnimatedRef = () => ({ current: null });

// useAnimatedReaction: no-op
const useAnimatedReaction = () => {};

// useDerivedValue
const useDerivedValue = (fn) => {
  try {
    return { value: fn() };
  } catch {
    return { value: undefined };
  }
};

module.exports = {
  __esModule: true,
  default: Animated,
  Animated,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedRef,
  useAnimatedReaction,
  useDerivedValue,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDecay,
  runOnJS,
  interpolate,
  Easing,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutRight,
  Layout,
  ZoomIn,
  ZoomOut,
  LinearTransition,
  ReduceMotionConfig,
  ReduceMotion,
};
