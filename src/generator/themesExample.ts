import type { Theme } from './common';

export const maxCBg = 5;
export const maxCAccent = 15;

export const darkTheme: Theme = {
    bg: {
        l: 20,
        cMax: 2,
    },
    overlay: {
        l: 28,
        cMax: 5,
    },
    accentLarge: {
        l: 53,
        cMax: 15,
        isAccent: true,
    },
    accentSmall: {
        l: 80,
        cMax: 15,
        isAccent: true,
    },
    accentBright: {
        l: 88,
        cMax: 10,
        isAccent: true,
    },
    text: {
        l: 98,
        cMax: 2,
    },
    textOnAccent: {
        l: 98,
        cMax: 1,
    },
};

export const lightTheme: Theme = {
    bg: {
        l: 97,
        cMax: 2,
    },
    overlay: {
        l: 88,
        cMax: 5,
    },
    accentLarge: {
        l: 53,
        cMax: 15,
        isAccent: true,
    },
    accentSmall: {
        l: 38,
        cMax: 18,
        isAccent: true,
    },
    accentBright: {
        l: 25,
        cMax: 10,
        isAccent: true,
    },
    text: {
        l: 18,
        cMax: 2,
    },
    textOnAccent: {
        l: 98,
        cMax: 1,
    },
};
