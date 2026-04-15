export const TYPE = {
  // Headings (DM Serif Display)
  displayLg: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, lineHeight: 34 },
  displaySm: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, lineHeight: 28 },
  // Titles (DM Sans Bold)
  titleLg: { fontFamily: 'DMSans_700Bold', fontSize: 18, lineHeight: 24 },
  titleMd: { fontFamily: 'DMSans_700Bold', fontSize: 16, lineHeight: 22 },
  titleSm: { fontFamily: 'DMSans_700Bold', fontSize: 14, lineHeight: 20 },
  // Body (DM Sans Regular)
  bodyLg: { fontFamily: 'DMSans_400Regular', fontSize: 16, lineHeight: 22 },
  bodyMd: { fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 20 },
  bodySm: { fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 18 },
  // Labels (DM Sans Medium)
  // labelMd bumped from 12→13 for legibility on aging eyes (Apple HIG suggests
  // 13pt as the floor for any reading-grade text). labelSm stays at 12 because
  // it's reserved for chips/badges where a single character bump would
  // distort the round shape.
  labelLg: { fontFamily: 'DMSans_500Medium', fontSize: 14, lineHeight: 20 },
  labelMd: { fontFamily: 'DMSans_500Medium', fontSize: 13, lineHeight: 18 },
  labelSm: { fontFamily: 'DMSans_500Medium', fontSize: 12, lineHeight: 16 },
  // Numbers (DM Sans Bold — stat cards, prices)
  numberLg: { fontFamily: 'DMSans_700Bold', fontSize: 24, lineHeight: 30 },
  numberMd: { fontFamily: 'DMSans_700Bold', fontSize: 18, lineHeight: 24 },
} as const;
