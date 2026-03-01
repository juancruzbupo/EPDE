export const fonts = {
  regular: { fontFamily: 'DMSans_400Regular' },
  medium: { fontFamily: 'DMSans_500Medium' },
  bold: { fontFamily: 'DMSans_700Bold' },
  heading: { fontFamily: 'PlayfairDisplay_700Bold' },
} as const;

export const TYPE = {
  // Headings (Playfair Display)
  displayLg: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 28, lineHeight: 34 },
  displaySm: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, lineHeight: 28 },
  // Titles (DM Sans Bold)
  titleLg: { fontFamily: 'DMSans_700Bold', fontSize: 18, lineHeight: 24 },
  titleMd: { fontFamily: 'DMSans_700Bold', fontSize: 16, lineHeight: 22 },
  titleSm: { fontFamily: 'DMSans_700Bold', fontSize: 14, lineHeight: 20 },
  // Body (DM Sans Regular)
  bodyLg: { fontFamily: 'DMSans_400Regular', fontSize: 16, lineHeight: 22 },
  bodyMd: { fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 20 },
  bodySm: { fontFamily: 'DMSans_400Regular', fontSize: 12, lineHeight: 16 },
  // Labels (DM Sans Medium)
  labelLg: { fontFamily: 'DMSans_500Medium', fontSize: 14, lineHeight: 20 },
  labelMd: { fontFamily: 'DMSans_500Medium', fontSize: 12, lineHeight: 16 },
  labelSm: { fontFamily: 'DMSans_500Medium', fontSize: 11, lineHeight: 14 },
  // Numbers (DM Sans Bold — stat cards, prices)
  numberLg: { fontFamily: 'DMSans_700Bold', fontSize: 24, lineHeight: 30 },
  numberMd: { fontFamily: 'DMSans_700Bold', fontSize: 18, lineHeight: 24 },
} as const;
