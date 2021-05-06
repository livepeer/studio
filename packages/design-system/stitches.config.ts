import { theme as t, darkTheme as dt } from "@modulz/design-system";

// default theme overrides
export const theme = t("theme-default", {
  colors: {
    gray000: "hsl(0 0% 99%)",
    gray100: "hsl(0 0% 97.3%)",
    gray200: "hsl(0 0% 95%)",
    gray300: "hsl(0 0% 92.9%)",
    gray400: "hsl(0 0% 90.8%)",
    gray500: "hsl(0 0% 88.6%)",
    gray600: "hsl(0 0% 85.7%)",
    gray700: "hsl(0 0% 78%)",
    gray800: "hsl(0 0% 56.1%)",
    gray900: "hsl(0, 0%, 43.5%)",
    gray1000: "hsl(0 0% 9%)",

    quartz000: "hsl(300 20% 99%)",
    quartz100: "hsl(300 7.7% 97.5%)",
    quartz200: "hsl(294 5.5% 95.3%)",
    quartz300: "hsl(289 4.7% 93.3%)",
    quartz400: "hsl(283 4.4% 91.3%)",
    quartz500: "hsl(278 4.1% 89.1%)",
    quartz600: "hsl(271 3.9% 86.3%)",
    quartz700: "hsl(255 3.7% 78.8%)",
    quartz800: "hsl(252 4% 57.3%)",
    quartz900: "hsl(252 4% 45%)",
    quartz1000: "hsl(260 25% 11%)",

    slate000: "hsl(206 30% 98.8%)",
    slate100: "hsl(210 16.7% 97.6%)",
    slate200: "hsl(209 13.3% 95.3%)",
    slate300: "hsl(209 12.2% 93.2%)",
    slate400: "hsl(208 11.7% 91.1%)",
    slate500: "hsl(208 11.3% 88.9%)",
    slate600: "hsl(207 11.1% 85.9%)",
    slate700: "hsl(205 10.7% 78%)",
    slate800: "hsl(206 6% 56.1%)",
    slate900: "hsl(206 6% 43.5%)",
    slate1000: "hsl(206 24% 9%)",

    sage000: "hsl(155 30% 98.8%)",
    sage100: "hsl(150 16.7% 97.6%)",
    sage200: "hsl(151 10.6% 95.2%)",
    sage300: "hsl(151 8.8% 93%)",
    sage400: "hsl(151 7.8% 90.8%)",
    sage500: "hsl(152 7.2% 88.4%)",
    sage600: "hsl(153 6.7% 85.3%)",
    sage700: "hsl(154 6.1% 77.5%)",
    sage800: "hsl(155, 3.5%, 55.5%)",
    sage900: "hsl(155, 3%, 43%)",
    sage1000: "hsl(155 24% 9%)",

    olive000: "hsl(110 20% 99%)",
    olive100: "hsl(120 16.7% 97.6%)",
    olive200: "hsl(119 10.1% 95.2%)",
    olive300: "hsl(118 8.1% 93%)",
    olive400: "hsl(117 7.1% 90.8%)",
    olive500: "hsl(115 6.4% 88.5%)",
    olive600: "hsl(114 5.9% 85.4%)",
    olive700: "hsl(110 5.2% 77.3%)",
    olive800: "hsl(110, 3.5%, 55.5%)",
    olive900: "hsl(110, 3%, 43%)",
    olive1000: "hsl(110 25% 9.5%)",

    sand000: "hsl(50 20% 99%)",
    sand100: "hsl(60 7.7% 97.5%)",
    sand200: "hsl(59 6.5% 95.1%)",
    sand300: "hsl(58 6.1% 92.9%)",
    sand400: "hsl(57 6% 90.7%)",
    sand500: "hsl(56 5.9% 88.4%)",
    sand600: "hsl(55 5.9% 85.2%)",
    sand700: "hsl(51 6% 77.1%)",
    sand800: "hsl(50 2% 55.7%)",
    sand900: "hsl(50 2% 43.1%)",
    sand1000: "hsl(50 6% 10%)",

    tomato000: "hsl(10 100% 99.4%)",
    tomato100: "hsl(8 100% 98.4%)",
    tomato200: "hsl(8 94.8% 96.3%)",
    tomato300: "hsl(8 91.2% 93.7%)",
    tomato400: "hsl(8 87.5% 90.5%)",
    tomato500: "hsl(9 83.3% 86.1%)",
    tomato600: "hsl(9 78% 79.9%)",
    tomato700: "hsl(10 71.6% 71%)",
    tomato800: "hsl(10 78% 54%)",
    tomato900: "hsl(10 82% 43.5%)",
    tomato1000: "hsl(10 50% 13.5%)",

    red000: "hsl(359 100% 99.4%)",
    red100: "hsl(359 100% 98.6%)",
    red200: "hsl(360 91.4% 96.5%)",
    red300: "hsl(360 87.2% 94.2%)",
    red400: "hsl(360 83.6% 91.5%)",
    red500: "hsl(360 79.8% 87.8%)",
    red600: "hsl(359 74.9% 82.1%)",
    red700: "hsl(359 69.5% 74.3%)",
    red800: "hsl(358 75% 59%)",
    red900: "hsl(358 65% 48.7%)",
    red1000: "hsl(354 50% 14.6%)",

    crimson000: "hsl(332 100% 99.4%)",
    crimson100: "hsl(330 100% 98.4%)",
    crimson200: "hsl(331 76.8% 96.2%)",
    crimson300: "hsl(331 70.6% 93.7%)",
    crimson400: "hsl(332 67.5% 90.7%)",
    crimson500: "hsl(333 65.6% 86.7%)",
    crimson600: "hsl(335 63.9% 80.9%)",
    crimson700: "hsl(336 62.3% 72.9%)",
    crimson800: "hsl(336 80% 57.8%)",
    crimson900: "hsl(336 75% 47.2%)",
    crimson1000: "hsl(340 65% 14.5%)",

    pink000: "hsl(322 100% 99.4%)",
    pink100: "hsl(323 100% 98.4%)",
    pink200: "hsl(323 77.4% 96.2%)",
    pink300: "hsl(323 70.8% 93.7%)",
    pink400: "hsl(323 67.3% 90.6%)",
    pink500: "hsl(323 64.8% 86.6%)",
    pink600: "hsl(323 62.4% 80.5%)",
    pink700: "hsl(323 60.3% 72.4%)",
    pink800: "hsl(322 65% 54.5%)",
    pink900: "hsl(322 75% 46%)",
    pink1000: "hsl(320 70% 13.5%)",

    plum000: "hsl(292 90% 99.4%)",
    plum100: "hsl(300 100% 98.6%)",
    plum200: "hsl(299 63.9% 96.1%)",
    plum300: "hsl(299 55.8% 93.3%)",
    plum400: "hsl(298 52.1% 90.1%)",
    plum500: "hsl(296 49.9% 85.8%)",
    plum600: "hsl(295 48.5% 79.5%)",
    plum700: "hsl(292 47.7% 70.8%)",
    plum800: "hsl(292 45% 51%)",
    plum900: "hsl(292 60% 42.5%)",
    plum1000: "hsl(291 66% 14%)",

    purple000: "hsl(280 65% 99.4%)",
    purple100: "hsl(276 100% 99%)",
    purple200: "hsl(276 72.2% 96.7%)",
    purple300: "hsl(275 66.8% 94.2%)",
    purple400: "hsl(275 64.3% 91.2%)",
    purple500: "hsl(274 62.7% 87.4%)",
    purple600: "hsl(273 61.3% 81.6%)",
    purple700: "hsl(272 60% 73.5%)",
    purple800: "hsl(272 51% 54%)",
    purple900: "hsl(272 50% 45.8%)",
    purple1000: "hsl(272 66% 16%)",

    violet000: "hsl(255 65% 99.4%)",
    violet100: "hsl(252 100% 99%)",
    violet200: "hsl(252 82.3% 97%)",
    violet300: "hsl(252 78% 94.9%)",
    violet400: "hsl(252 75.6% 92.3%)",
    violet500: "hsl(252 73.5% 88.9%)",
    violet600: "hsl(252 71.3% 83.9%)",
    violet700: "hsl(252 68.6% 76.3%)",
    violet800: "hsl(252 56% 57.5%)",
    violet900: "hsl(250 43% 48%)",
    violet1000: "hsl(254 60% 18.5%)",

    indigo000: "hsl(225 60% 99.4%)",
    indigo100: "hsl(223 100% 98.6%)",
    indigo200: "hsl(223 88.8% 96.7%)",
    indigo300: "hsl(224 85% 94.4%)",
    indigo400: "hsl(224 82.6% 91.5%)",
    indigo500: "hsl(224 80.6% 87.7%)",
    indigo600: "hsl(225 78.3% 82.3%)",
    indigo700: "hsl(226 75.4% 74.5%)",
    indigo800: "hsl(226 70% 55.5%)",
    indigo900: "hsl(226 55% 45%)",
    indigo1000: "hsl(226 62% 17%)",

    blue000: "hsl(206 100% 99.2%)",
    blue100: "hsl(204 100% 98%)",
    blue200: "hsl(204 87.1% 95.7%)",
    blue300: "hsl(205 82.9% 92.6%)",
    blue400: "hsl(205 81.3% 88.4%)",
    blue500: "hsl(206 80.9% 83.1%)",
    blue600: "hsl(206 81.1% 76%)",
    blue700: "hsl(206 81.9% 65.3%)",
    blue800: "hsl(206 100% 50%)",
    blue900: "hsl(211 100% 43.2%)",
    blue1000: "hsl(211 100% 15%)",

    sky000: "hsl(193 100% 98.8%)",
    sky100: "hsl(193 100% 97.3%)",
    sky200: "hsl(193 85.4% 94.1%)",
    sky300: "hsl(193 81.1% 90.2%)",
    sky400: "hsl(193 79.5% 85.5%)",
    sky500: "hsl(193 79.3% 80.1%)",
    sky600: "hsl(193 79.7% 74.6%)",
    sky700: "hsl(193 80.4% 70%)",
    sky800: "hsl(193 98% 70%)",
    sky900: "hsl(195 100% 31.5%)",
    sky1000: "hsl(195 100% 13%)",

    cyan000: "hsl(185 60% 98.7%)",
    cyan100: "hsl(185 73.3% 97.1%)",
    cyan200: "hsl(186 60.3% 94.1%)",
    cyan300: "hsl(187 55.7% 90.2%)",
    cyan400: "hsl(187 54.1% 85.1%)",
    cyan500: "hsl(188 54% 78%)",
    cyan600: "hsl(189 55.7% 68%)",
    cyan700: "hsl(189 60.3% 52.5%)",
    cyan800: "hsl(190 95% 39%)",
    cyan900: "hsl(192 85% 31%)",
    cyan1000: "hsl(192 88% 12.5%)",

    teal000: "hsl(165 60% 98.8%)",
    teal100: "hsl(169 64.7% 96.7%)",
    teal200: "hsl(169 51.9% 93.6%)",
    teal300: "hsl(169 46.5% 89.7%)",
    teal400: "hsl(170 43.6% 84.4%)",
    teal500: "hsl(170 42% 77.3%)",
    teal600: "hsl(171 41.2% 67.1%)",
    teal700: "hsl(172 42.1% 52.5%)",
    teal800: "hsl(173 80% 36%)",
    teal900: "hsl(174 90% 25.2%)",
    teal1000: "hsl(170 50% 12.5%)",

    green000: "hsl(136 50% 98.9%)",
    green100: "hsl(138 62.5% 96.9%)",
    green200: "hsl(139 49.8% 94.1%)",
    green300: "hsl(140 44.4% 90.4%)",
    green400: "hsl(141 41.6% 85.4%)",
    green500: "hsl(143 40% 78.7%)",
    green600: "hsl(146 39.4% 69%)",
    green700: "hsl(151 40.2% 54.1%)",
    green800: "hsl(151 55% 41.5%)",
    green900: "hsl(153 67% 28.5%)",
    green1000: "hsl(155 40% 14%)",

    lime000: "hsl(85 50% 98.7%)",
    lime100: "hsl(85 66.7% 96.5%)",
    lime200: "hsl(84 64.4% 91.4%)",
    lime300: "hsl(82 63.4% 85.8%)",
    lime400: "hsl(81 62.6% 79.5%)",
    lime500: "hsl(79 62% 72.4%)",
    lime600: "hsl(77 61.7% 64.5%)",
    lime700: "hsl(76 61.8% 56.9%)",
    lime800: "hsl(81 67% 50%)",
    lime900: "hsl(75 80% 26%)",
    lime1000: "hsl(78 70% 11.5%)",

    yellow000: "hsl(60 54% 98.5%)",
    yellow100: "hsl(53 100% 95.1%)",
    yellow200: "hsl(53 90.2% 88.1%)",
    yellow300: "hsl(52 87.5% 81.3%)",
    yellow400: "hsl(52 86.2% 74.7%)",
    yellow500: "hsl(52 85.4% 68.3%)",
    yellow600: "hsl(53 85% 62%)",
    yellow700: "hsl(53 85.2% 55.1%)",
    yellow800: "hsl(53 92% 50%)",
    yellow900: "hsl(42 100% 29%)",
    yellow1000: "hsl(40 55% 13.5%)",

    amber000: "hsl(39 70% 99%)",
    amber100: "hsl(40 100% 96.5%)",
    amber200: "hsl(40 100% 92%)",
    amber300: "hsl(40 100% 87.2%)",
    amber400: "hsl(40 100% 81.9%)",
    amber500: "hsl(39 100% 76.1%)",
    amber600: "hsl(39 100% 69.8%)",
    amber700: "hsl(39 100% 63.9%)",
    amber800: "hsl(39 100% 57%)",
    amber900: "hsl(30 100% 34%)",
    amber1000: "hsl(20 80% 17%)",

    orange000: "hsl(24 70% 99%)",
    orange100: "hsl(24 83.3% 97.6%)",
    orange200: "hsl(25 100% 94.9%)",
    orange300: "hsl(25 100% 91.6%)",
    orange400: "hsl(25 100% 87.5%)",
    orange500: "hsl(25 100% 82.1%)",
    orange600: "hsl(24 100% 74.9%)",
    orange700: "hsl(24 94.5% 64.3%)",
    orange800: "hsl(24 94% 50%)",
    orange900: "hsl(24 100% 37%)",
    orange1000: "hsl(15 60% 17%)",

    brown000: "hsl(30 40% 99.1%)",
    brown100: "hsl(30 50% 97.6%)",
    brown200: "hsl(30 52.5% 94.6%)",
    brown300: "hsl(30 53% 91.2%)",
    brown400: "hsl(29 52.9% 86.8%)",
    brown500: "hsl(29 52.5% 80.9%)",
    brown600: "hsl(29 51.5% 72.8%)",
    brown700: "hsl(28 50% 63.1%)",
    brown800: "hsl(28 34% 51%)",
    brown900: "hsl(25 30% 41%)",
    brown1000: "hsl(20 30% 19%)",

    bronze000: "hsl(15 30% 99.1%)",
    bronze100: "hsl(17 63.6% 97.8%)",
    bronze200: "hsl(17 42.1% 95.2%)",
    bronze300: "hsl(17 35.2% 92.1%)",
    bronze400: "hsl(17 31.5% 88.2%)",
    bronze500: "hsl(17 29% 83%)",
    bronze600: "hsl(17 26.9% 75.6%)",
    bronze700: "hsl(17 25.1% 66.5%)",
    bronze800: "hsl(17 20% 54%)",
    bronze900: "hsl(15 20% 43.1%)",
    bronze1000: "hsl(12 22% 21.5%)",

    gold000: "hsl(50 20% 99.1%)",
    gold100: "hsl(47 52.9% 96.7%)",
    gold200: "hsl(46 38.2% 93.7%)",
    gold300: "hsl(44 32.7% 90.1%)",
    gold400: "hsl(43 29.9% 85.7%)",
    gold500: "hsl(41 28.3% 79.8%)",
    gold600: "hsl(39 27.6% 71.9%)",
    gold700: "hsl(36 27.2% 61.8%)",
    gold800: "hsl(36 20% 49.5%)",
    gold900: "hsl(36 20% 39%)",
    gold1000: "hsl(36 16% 20%)",

    // Semantic colors
    hiContrast: "$slate1000",
    // loContrast: '$slate000',
    loContrast: "white",
    canvas: "hsl(0 0% 93%)",
    panel: "white",
    transparentPanel: "hsl(0 0% 0% / 97%)",
    shadowLight: "hsl(206 22% 7% / 35%)",
    shadowDark: "hsl(206 22% 7% / 20%)",
  },
  fonts: {
    untitled: "Untitled Sans, -apple-system, system-ui, sans-serif",
    mono: "Söhne Mono, menlo, monospace",
  },
  space: {
    1: "5px",
    2: "10px",
    3: "15px",
    4: "20px",
    5: "25px",
    6: "35px",
    7: "45px",
    8: "65px",
    9: "80px",
  },
  sizes: {
    1: "5px",
    2: "10px",
    3: "15px",
    4: "20px",
    5: "25px",
    6: "35px",
    7: "45px",
    8: "65px",
    9: "80px",
  },
  fontSizes: {
    1: "12px",
    2: "13px",
    3: "15px",
    4: "17px",
    5: "19px",
    6: "21px",
    7: "27px",
    8: "35px",
    9: "59px",
  },
  radii: {
    1: "4px",
    2: "6px",
    3: "8px",
    4: "12px",
    round: "50%",
    pill: "9999px",
  },
  zIndices: {
    1: "100",
    2: "200",
    3: "300",
    4: "400",
    max: "999",
  },
});

// dark theme overrides
export const darkTheme = t("dark-theme", {
  colors: {
    gray000: "hsl(0 0% 8.2%)",
    gray100: "hsl(0 0% 9.6%)",
    gray200: "hsl(0 0% 11.5%)",
    gray300: "hsl(0 0% 13.6%)",
    gray400: "hsl(0 0% 16.2%)",
    gray500: "hsl(0 0% 19.7%)",
    gray600: "hsl(0 0% 24.5%)",
    gray700: "hsl(0 0% 31%)",
    gray800: "hsl(0 0% 43.9%)",
    gray900: "hsl(0 0% 52.9%)",
    gray1000: "hsl(0 0% 93%)",

    quartz000: "hsl(246 5% 8.6%)",
    quartz100: "hsl(240 6.1% 9.6%)",
    quartz200: "hsl(241 5.8% 11.6%)",
    quartz300: "hsl(241 5.6% 13.8%)",
    quartz400: "hsl(242 5.4% 16.5%)",
    quartz500: "hsl(244 5.2% 20.2%)",
    quartz600: "hsl(245 5% 25.3%)",
    quartz700: "hsl(247 4.9% 32.2%)",
    quartz800: "hsl(252 4% 45%)",
    quartz900: "hsl(253 4% 54%)",
    quartz1000: "hsl(256 6% 93%)",

    slate000: "hsl(200 7% 8.4%)",
    slate100: "hsl(200 6.1% 9.6%)",
    slate200: "hsl(200 6.2% 11.5%)",
    slate300: "hsl(201 6.2% 13.6%)",
    slate400: "hsl(201 6.3% 16.2%)",
    slate500: "hsl(202 6.3% 19.6%)",
    slate600: "hsl(203 6.3% 24.4%)",
    slate700: "hsl(204 6.3% 31%)",
    slate800: "hsl(206 6% 43.9%)",
    slate900: "hsl(205 5% 52.9%)",
    slate1000: "hsl(210 6% 93%)",

    sage000: "hsl(155 7% 8.4%)",
    sage100: "hsl(160 6.1% 9.6%)",
    sage200: "hsl(159 5.8% 11.4%)",
    sage300: "hsl(159 5.5% 13.4%)",
    sage400: "hsl(158 5.3% 15.9%)",
    sage500: "hsl(157 5% 19.2%)",
    sage600: "hsl(156 4.8% 23.8%)",
    sage700: "hsl(154 4.6% 30%)",
    sage800: "hsl(155 6% 42.5%)",
    sage900: "hsl(155 5% 51.9%)",
    sage1000: "hsl(155 6% 93%)",

    olive000: "hsl(110 7% 8.4%)",
    olive100: "hsl(108 10.2% 9.6%)",
    olive200: "hsl(109 8.9% 11.4%)",
    olive300: "hsl(109 7.9% 13.4%)",
    olive400: "hsl(109 7% 15.9%)",
    olive500: "hsl(110 6.1% 19.2%)",
    olive600: "hsl(110 5.3% 23.8%)",
    olive700: "hsl(111 4.6% 30%)",
    olive800: "hsl(110 6% 42.5%)",
    olive900: "hsl(110 5% 51.9%)",
    olive1000: "hsl(110 6% 93%)",

    sand000: "hsl(61 2% 8.3%)",
    sand100: "hsl(60 2% 9.6%)",
    sand200: "hsl(58 2.4% 11.4%)",
    sand300: "hsl(56 2.8% 13.4%)",
    sand400: "hsl(53 3.1% 15.9%)",
    sand500: "hsl(50 3.6% 19.2%)",
    sand600: "hsl(47 4% 23.8%)",
    sand700: "hsl(43 4.6% 30%)",
    sand800: "hsl(50 4% 42.5%)",
    sand900: "hsl(49 3% 52%)",
    sand1000: "hsl(56 4% 94%)",

    tomato000: "hsl(10 23% 9.4%)",
    tomato100: "hsl(10 34.6% 10.2%)",
    tomato200: "hsl(9 38.7% 12%)",
    tomato300: "hsl(8 43.2% 14.1%)",
    tomato400: "hsl(8 48.2% 16.8%)",
    tomato500: "hsl(8 53.3% 20.3%)",
    tomato600: "hsl(8 59.2% 25.3%)",
    tomato700: "hsl(10 70.2% 36.9%)",
    tomato800: "hsl(10 78% 54%)",
    tomato900: "hsl(10 100% 68%)",
    tomato1000: "hsl(10 89% 96%)",

    red000: "hsl(353 23% 9.4%)",
    red100: "hsl(353 34.6% 10.2%)",
    red200: "hsl(352 38.8% 11.9%)",
    red300: "hsl(352 43.6% 14%)",
    red400: "hsl(352 48.4% 16.7%)",
    red500: "hsl(351 53.7% 20.2%)",
    red600: "hsl(352 59.9% 25.2%)",
    red700: "hsl(353 70.2% 36.9%)",
    red800: "hsl(358 75% 59%)",
    red900: "hsl(358 100% 68%)",
    red1000: "hsl(351 89% 96%)",

    crimson000: "hsl(335 16% 8.7%)",
    crimson100: "hsl(335 33.3% 10%)",
    crimson200: "hsl(335 38.5% 12.1%)",
    crimson300: "hsl(335 43.7% 14.5%)",
    crimson400: "hsl(335 49.2% 17.6%)",
    crimson500: "hsl(335 55.5% 21.6%)",
    crimson600: "hsl(335 64% 27.2%)",
    crimson700: "hsl(334 80.3% 35.9%)",
    crimson800: "hsl(336 80% 57.8%)",
    crimson900: "hsl(341 90% 63.1%)",
    crimson1000: "hsl(332 87% 96%)",

    pink000: "hsl(318 20% 8.8%)",
    pink100: "hsl(318 33.3% 10%)",
    pink200: "hsl(318 38.1% 12.4%)",
    pink300: "hsl(318 42.6% 15.1%)",
    pink400: "hsl(318 47.1% 18.3%)",
    pink500: "hsl(319 52.3% 22.5%)",
    pink600: "hsl(319 59.3% 28.5%)",
    pink700: "hsl(320 72.2% 38%)",
    pink800: "hsl(322 65% 54.5%)",
    pink900: "hsl(325 90% 67.1%)",
    pink1000: "hsl(322 90% 95.8%)",

    plum000: "hsl(301 20% 8.8%)",
    plum100: "hsl(300 29.4% 10%)",
    plum200: "hsl(299 35.1% 12.7%)",
    plum300: "hsl(298 39.9% 15.7%)",
    plum400: "hsl(298 44.2% 19.1%)",
    plum500: "hsl(297 48.4% 23.2%)",
    plum600: "hsl(297 53.2% 28.8%)",
    plum700: "hsl(296 59.8% 38%)",
    plum800: "hsl(292 45% 51%)",
    plum900: "hsl(300 75% 66.1%)",
    plum1000: "hsl(296 74% 95.7%)",

    purple000: "hsl(284 13% 9.2%)",
    purple100: "hsl(284 28.3% 10.4%)",
    purple200: "hsl(282 34.7% 13.2%)",
    purple300: "hsl(281 39.8% 16.4%)",
    purple400: "hsl(279 44% 20%)",
    purple500: "hsl(278 47.8% 24.5%)",
    purple600: "hsl(275 51.4% 30.8%)",
    purple700: "hsl(272 55.1% 42%)",
    purple800: "hsl(272 51% 54%)",
    purple900: "hsl(275 91% 71%)",
    purple1000: "hsl(279 75% 95.7%)",

    violet000: "hsl(250 15% 9.5%)",
    violet100: "hsl(250 30% 11.8%)",
    violet200: "hsl(249 36.5% 15.3%)",
    violet300: "hsl(248 41.1% 19.1%)",
    violet400: "hsl(248 44.8% 23.4%)",
    violet500: "hsl(248 48.3% 28.7%)",
    violet600: "hsl(249 52.3% 36.8%)",
    violet700: "hsl(252 57.6% 50%)",
    violet800: "hsl(252 56% 57.5%)",
    violet900: "hsl(250 100% 76.1%)",
    violet1000: "hsl(252 87% 96.4%)",

    indigo000: "hsl(229 24% 9.8%)",
    indigo100: "hsl(229 36.7% 11.8%)",
    indigo200: "hsl(228 42.2% 14.6%)",
    indigo300: "hsl(227 46.8% 17.7%)",
    indigo400: "hsl(226 51.1% 21.2%)",
    indigo500: "hsl(225 55.3% 25.8%)",
    indigo600: "hsl(224 59.5% 32.7%)",
    indigo700: "hsl(225 61.8% 47.3%)",
    indigo800: "hsl(226 70% 55.5%)",
    indigo900: "hsl(228 100% 72.9%)",
    indigo1000: "hsl(226 83% 96.3%)",

    blue000: "hsl(212 25% 8.7%)",
    blue100: "hsl(212 50% 10.2%)",
    blue200: "hsl(211 57.9% 12.9%)",
    blue300: "hsl(210 65.1% 15.7%)",
    blue400: "hsl(209 72.5% 18.6%)",
    blue500: "hsl(208 81.1% 22.1%)",
    blue600: "hsl(207 92.7% 27.3%)",
    blue700: "hsl(208 93.1% 40%)",
    blue800: "hsl(206 100% 50%)",
    blue900: "hsl(210 100% 66.1%)",
    blue1000: "hsl(206 98% 95.8%)",

    sky000: "hsl(193 60% 7.3%)",
    sky100: "hsl(193 80% 7.8%)",
    sky200: "hsl(193 79.8% 9.5%)",
    sky300: "hsl(193 79.7% 11.6%)",
    sky400: "hsl(192 79.4% 14.4%)",
    sky500: "hsl(192 78.8% 18.6%)",
    sky600: "hsl(192 78.2% 25.9%)",
    sky700: "hsl(193 93% 55.1%)",
    sky800: "hsl(193 98% 70%)",
    sky900: "hsl(198 100% 55.1%)",
    sky1000: "hsl(198 98% 95.8%)",

    cyan000: "hsl(192 38% 7.5%)",
    cyan100: "hsl(192 68.4% 7.5%)",
    cyan200: "hsl(192 67.6% 10.1%)",
    cyan300: "hsl(191 68.9% 12.9%)",
    cyan400: "hsl(191 70.8% 16.1%)",
    cyan500: "hsl(191 73.4% 19.7%)",
    cyan600: "hsl(190 77% 24.2%)",
    cyan700: "hsl(190 85.3% 32%)",
    cyan800: "hsl(190 95% 39%)",
    cyan900: "hsl(192 80% 47.1%)",
    cyan1000: "hsl(185 73% 93.2%)",

    teal000: "hsl(168 48% 6.5%)",
    teal100: "hsl(168 75.8% 6.5%)",
    teal200: "hsl(168 68.1% 8.4%)",
    teal300: "hsl(169 68% 10.4%)",
    teal400: "hsl(170 67.9% 12.8%)",
    teal500: "hsl(170 68.5% 15.9%)",
    teal600: "hsl(171 70.8% 20.2%)",
    teal700: "hsl(173 79.7% 29%)",
    teal800: "hsl(173 80% 36%)",
    teal900: "hsl(174 90% 40%)",
    teal1000: "hsl(166 73% 93.1%)",

    green000: "hsl(146 30% 7.4%)",
    green100: "hsl(147 42.9% 8.2%)",
    green200: "hsl(147 43.8% 9.9%)",
    green300: "hsl(148 45.7% 11.9%)",
    green400: "hsl(148 47.8% 14.3%)",
    green500: "hsl(149 50.4% 17.5%)",
    green600: "hsl(150 53.7% 22.6%)",
    green700: "hsl(151 59.8% 35.1%)",
    green800: "hsl(151 55% 41.5%)",
    green900: "hsl(136 50% 55.1%)",
    green1000: "hsl(137 72% 94%)",

    lime000: "hsl(80 20% 7.5%)",
    lime100: "hsl(80 47.4% 7.5%)",
    lime200: "hsl(84 44.4% 9.2%)",
    lime300: "hsl(86 44.8% 11.2%)",
    lime400: "hsl(86 48.1% 13.9%)",
    lime500: "hsl(85 53% 17.5%)",
    lime600: "hsl(83 59.9% 23.3%)",
    lime700: "hsl(76 84.5% 38%)",
    lime800: "hsl(81 67% 50%)",
    lime900: "hsl(81 70% 50%)",
    lime1000: "hsl(84 79% 92.6%)",

    yellow000: "hsl(44 25% 7.6%)",
    yellow100: "hsl(44 59% 7.6%)",
    yellow200: "hsl(44 54.8% 9.3%)",
    yellow300: "hsl(45 53.6% 11.4%)",
    yellow400: "hsl(45 55.8% 14.2%)",
    yellow500: "hsl(46 60.8% 18.1%)",
    yellow600: "hsl(47 67.6% 24.4%)",
    yellow700: "hsl(50 100% 45.1%)",
    yellow800: "hsl(53 92% 50%)",
    yellow900: "hsl(49 80% 52.2%)",
    yellow1000: "hsl(55 93% 89.9%)",

    amber000: "hsl(39 30% 8%)",
    amber100: "hsl(38 50% 8.6%)",
    amber200: "hsl(38 50.1% 10.1%)",
    amber300: "hsl(38 51.8% 12.1%)",
    amber400: "hsl(38 55.5% 14.8%)",
    amber500: "hsl(38 61.2% 18.6%)",
    amber600: "hsl(38 68.6% 24.9%)",
    amber700: "hsl(39 90.2% 48%)",
    amber800: "hsl(39 100% 57%)",
    amber900: "hsl(39 90% 51.2%)",
    amber1000: "hsl(39 97% 93.2%)",

    orange000: "hsl(24 20% 8.8%)",
    orange100: "hsl(25 59.2% 9.6%)",
    orange200: "hsl(23 57.8% 11.3%)",
    orange300: "hsl(22 58% 13.4%)",
    orange400: "hsl(22 59.8% 16.3%)",
    orange500: "hsl(22 63.4% 20.4%)",
    orange600: "hsl(23 68.2% 27.3%)",
    orange700: "hsl(24 90% 52.9%)",
    orange800: "hsl(24 94% 50%)",
    orange900: "hsl(24 90% 60.2%)",
    orange1000: "hsl(24 97% 93.2%)",

    brown000: "hsl(22 15% 8.6%)",
    brown100: "hsl(22 40.4% 9.2%)",
    brown200: "hsl(20 38% 11.6%)",
    brown300: "hsl(20 38.8% 14.2%)",
    brown400: "hsl(21 40.4% 17.4%)",
    brown500: "hsl(22 42.1% 21.7%)",
    brown600: "hsl(24 44.2% 28.5%)",
    brown700: "hsl(28 47.8% 45.1%)",
    brown800: "hsl(28 34% 51%)",
    brown900: "hsl(28 60% 55.9%)",
    brown1000: "hsl(30 67% 94%)",

    bronze000: "hsl(17 3% 8.8%)",
    bronze100: "hsl(17 13.7% 10%)",
    bronze200: "hsl(17 16.6% 12.9%)",
    bronze300: "hsl(17 18.7% 15.9%)",
    bronze400: "hsl(17 20.2% 19.2%)",
    bronze500: "hsl(17 21.5% 23.3%)",
    bronze600: "hsl(18 22.9% 29.2%)",
    bronze700: "hsl(18 24.9% 44.9%)",
    bronze800: "hsl(17 20% 54%)",
    bronze900: "hsl(18 37% 61%)",
    bronze1000: "hsl(18 57% 94.1%)",

    gold000: "hsl(44 4% 8.5%)",
    gold100: "hsl(43 14.9% 9.2%)",
    gold200: "hsl(43 16.9% 11.5%)",
    gold300: "hsl(42 19% 14%)",
    gold400: "hsl(41 20.9% 17%)",
    gold500: "hsl(41 22.7% 21%)",
    gold600: "hsl(39 24.6% 27.1%)",
    gold700: "hsl(36 27.8% 45.1%)",
    gold800: "hsl(36 20% 49.5%)",
    gold900: "hsl(35 50% 62.9%)",
    gold1000: "hsl(49 52% 93.8%)",

    // Semantic colors
    hiContrast: "$slate1000",
    loContrast: "$slate000",
    canvas: "hsl(0 0% 15%)",
    panel: "$slate200",
    transparentPanel: "hsl(0 100% 100% / 97%)",
    shadowLight: "hsl(206 22% 7% / 35%)",
    shadowDark: "hsl(206 22% 7% / 20%)",
  },
});

export {
  styled,
  css,
  getCssString,
  global,
  keyframes,
} from "@modulz/design-system";
