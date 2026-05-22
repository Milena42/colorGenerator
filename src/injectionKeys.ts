import type { InjectionKey, Ref } from 'vue';
import type { ContentClient } from './extension/contentClient';
import type { ColorFormat, GenericColorRole, ThemeParams } from './generator/common';
import type { ColorRole, ThemeName } from './generator/themesExample';

export const THEME_PARAMS = Symbol() as InjectionKey<Ref<ThemeParams<ThemeName, ColorRole>>>;
export const THEME_PARAMS_USER = Symbol() as InjectionKey<
    Ref<ThemeParams<'theme', GenericColorRole>>
>;
export const CONTENT_SCRIPT_CLIENT = Symbol() as InjectionKey<ContentClient>;

export const SHOW_PLOTS = Symbol() as InjectionKey<Ref<boolean>>;
export const SHOW_QUANTITY_ON_PLOTS = Symbol() as InjectionKey<Ref<boolean>>;
export const SHOW_WIREFRAME_ON_PLOTS = Symbol() as InjectionKey<Ref<boolean>>;

export const COLOR_FORMAT_EDIT = Symbol() as InjectionKey<Ref<ColorFormat>>;
export const COLOR_FORMAT_COPY = Symbol() as InjectionKey<Ref<ColorFormat>>;

export const ALWAYS_SHOW_COLOR_STRINGS = Symbol() as InjectionKey<Ref<boolean>>;
