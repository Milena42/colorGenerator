import type { Theme } from './myTypes';

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
    },
    accentSmall: {
        l: 80,
        cMax: 15,
    },
    accentOnOverlay: {
        l: 88,
        cMax: 10,
    },
    text: {
        l: 98,
        cMax: 2,
    },
    textOnAccent: {
        l: 20,
        cMax: 2,
    },
};

export const lightTheme: Theme = {
    bg: {
        l: 96,
        cMax: 2,
    },
    overlay: {
        l: 90,
        cMax: 5,
    },
    accentLarge: {
        l: 65,
        cMax: 15,
    },
    accentSmall: {
        l: 35,
        cMax: 15,
    },
    accentOnOverlay: {
        l: 25,
        cMax: 10,
    },
    text: {
        l: 20,
        cMax: 2,
    },
    textOnAccent: {
        l: 96,
        cMax: 1,
    },
};
