import type { Theme } from './myTypes';

export const maxCBg = 5;
export const maxCAccent = 15;

const overlayDark = {
    l: 28,
    cMax: 5,
};
const accentLargeDark = {
    l: 50,
    cMax: 15,
};

export const darkTheme: Theme = {
    bg: {
        l: 20,
        cMax: 2,
    },
    overlay: overlayDark,
    card1: overlayDark,
    card2: overlayDark,
    card3: overlayDark,

    accentLarge: accentLargeDark,
    accentSmall: {
        l: 78,
        cMax: 15,
    },
    text: {
        l: 96,
        cMax: 2,
    },
    textOnAccent: {
        l: 96,
        cMax: 2,
    },
    accent2: accentLargeDark,
    accent3: accentLargeDark,
};

const accentLargeDarkHighContrast = {
    l: 80,
    cMax: 15,
};

export const darkThemeHighContrast: Theme = {
    bg: {
        l: 20,
        cMax: 2,
    },
    overlay: overlayDark,
    card1: overlayDark,
    card2: overlayDark,
    card3: overlayDark,

    accentLarge: accentLargeDarkHighContrast,
    accentSmall: {
        l: 80,
        cMax: 15,
    },
    text: {
        l: 98,
        cMax: 2,
    },
    textOnAccent: {
        l: 20,
        cMax: 2,
    },
    accent2: accentLargeDarkHighContrast,
    accent3: accentLargeDarkHighContrast,
};

const overlayLight = {
    l: 88,
    cMax: 5,
};
const accentLargeLight = {
    l: 75,
    cMax: 15,
};

export const lightTheme: Theme = {
    bg: {
        l: 96,
        cMax: 2,
    },
    overlay: overlayLight,
    card1: overlayLight,
    card2: overlayLight,
    card3: overlayLight,

    accentLarge: accentLargeLight,
    accentSmall: {
        l: 45,
        cMax: 15,
    },

    text: {
        l: 20,
        cMax: 2,
    },
    textOnAccent: {
        l: 20,
        cMax: 2,
    },
    accent2: accentLargeLight,
    accent3: accentLargeLight,
};

const accentLargeLightHighContrast = {
    l: 40,
    cMax: 15,
};

export const lightThemeHighContrast: Theme = {
    bg: {
        l: 96,
        cMax: 2,
    },
    overlay: overlayLight,
    card1: overlayLight,
    card2: overlayLight,
    card3: overlayLight,
    accentLarge: accentLargeLightHighContrast,
    accentSmall: {
        l: 35,
        cMax: 15,
    },

    text: {
        l: 20,
        cMax: 2,
    },
    textOnAccent: {
        l: 96,
        cMax: 2,
    },
    accent2: accentLargeLightHighContrast,
    accent3: accentLargeLightHighContrast,
};
