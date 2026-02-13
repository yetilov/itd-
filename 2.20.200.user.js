// ==UserScript==
// @name         ИТД+
// @namespace    http://tampermonkey.net/
// @version       v2.20.200
// @description  BF | test pool 2
// @author       @VCB / TG: @YETILOV
// @match        https://xn--d1ah4a.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=xn--d1ah4a.com
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @updateURL    https://github.com/yetilov/itd-/raw/refs/heads/main/2.20.200.user.js
// @downloadURL  https://github.com/yetilov/itd-/raw/refs/heads/main/2.20.200.user.js
// ==/UserScript==
(function() {
    'use strict';
    const CONFIG = {
        CHECK_INTERVAL: 2000,
        NOTIFICATION_DURATION: 5000
    };
    const defaultSettings = {
        enabled: true,
        emojiEnabled: true,
        colorScheme: 'purple',
        customColor: '#bc50d4'
    };
    const colorSchemes = {
        purple: { name: 'Фиолетовая  (стандартная)', primary: '#bc50d4', secondary: '#9c27b0', accent: '#b450d4', light: '#d47de8', dark: '#8a2be2' },
        blue: { name: 'Синяя', primary: '#4285f4', secondary: '#1a73e8', accent: '#5c9bf2', light: '#8ab4f8', dark: '#0d47a1' },
        green: { name: 'Зелёная', primary: '#34a853', secondary: '#2e7d32', accent: '#4caf50', light: '#81c784', dark: '#1b5e20' },
        red: { name: 'Красная', primary: '#ea4335', secondary: '#d32f2f', accent: '#f44336', light: '#ef9a9a', dark: '#b71c1c' },
        orange: { name: 'Оранжевая', primary: '#f57c00', secondary: '#ef6c00', accent: '#ff9800', light: '#ffb74d', dark: '#e65100' },
        teal: { name: 'Бирюзовая', primary: '#009688', secondary: '#00796b', accent: '#4db6ac', light: '#80cbc4', dark: '#004d40' }
    };
    let settings = loadSettings();
    let isSettingsButtonAdded = false;
    let currentModal = null;
    let expandedDescriptions = { enabled: false, emoji: false, colors: false };
    let emojiObserver = null;
    let bannerButtonObserver = null;
    let emojiPickerActive = false;
    let activeEmojiField = null;
    let processEmojiDOM = null;
    let emojiPickerElement = null;
    let emojiPickerHideTimer = null;
    let emojiPickerCurrentButton = null;
    function loadSettings() {
        try {
            const saved = GM_getValue('itd_fixed_settings');
            return saved ? JSON.parse(saved) : { ...defaultSettings };
        } catch (e) {
            return { ...defaultSettings };
        }
    }
    function saveSettings() {
        GM_setValue('itd_fixed_settings', JSON.stringify(settings));
    }
    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `${r}, ${g}, ${b}`;
    }
    function getCurrentColorScheme() {
        if (settings.colorScheme === 'custom' && settings.customColor) {
            const color = settings.customColor;
            const rgb = hexToRgb(color);
            return {
                name: 'Пользовательская',
                primary: color,
                secondary: color,
                accent: color,
                light: color,
                dark: color,
                primaryRgb: rgb,
                secondaryRgb: rgb,
                accentRgb: rgb,
                lightRgb: rgb,
                darkRgb: rgb
            };
        }
        const scheme = colorSchemes[settings.colorScheme] || colorSchemes.purple;
        return {
            ...scheme,
            primaryRgb: hexToRgb(scheme.primary),
            secondaryRgb: hexToRgb(scheme.secondary),
            accentRgb: hexToRgb(scheme.accent),
            lightRgb: hexToRgb(scheme.light),
            darkRgb: hexToRgb(scheme.dark)
        };
    }
    const baseCSS = `body{font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif!important;font-size:1rem!important;color:rgb(174 162 162)!important;background-color:rgb(4 4 4)!important;line-height:1.2!important;-webkit-font-smoothing:antialiased!important;-moz-osx-font-smoothing:grayscale!important;}.sidebar-mobile.svelte-16uf3bx{display:block!important;position:fixed!important;bottom:0!important;left:0!important;right:0!important;z-index:40!important;background-color:rgb(18 19 20 / 92%)!important;border-radius:999px!important;margin:1rem!important;padding:6px!important;-webkit-backdrop-filter:blur(8px)!important;backdrop-filter:blur(8px)!important;box-shadow:0 0 0 1px var(--itd-primary) inset!important;}.sidebar-pill.svelte-13vg9xt{border-radius:9999px!important;padding:1.05rem!important;display:flex!important;border:1px solid var(--itd-secondary)!important;flex-direction:column!important;width:80%!important;flex-wrap:nowrap!important;}.right-sidebar.svelte-1f0m1ej{display:flex!important;flex-direction:column!important;justify-content:end!important;width:0px!important;height:9999vh!important;position:fixed!important;left:calc(50%+349px)!important;top:50%!important;transform:translateY(-50%)!important;pointer-events:none!important;}.sidebar-nav.svelte-13vg9xt{display:flex!important;flex-direction:column!important;gap:2rem!important;}.profile-avatar.svelte-p40znu{position:relative!important;width:130px!important;height:130px!important;border-radius:9999px!important;border:1px solid var(--itd-secondary)!important;overflow:hidden!important;display:flex!important;align-items:center!important;justify-content:center!important;background-color:rgb(52 32 55)!important;}.sidebar-nav-item.svelte-13vg9xt{padding:0.6rem!important;border-radius:9999px!important;color:rgba(var(--itd-light-rgb),0.63)!important;position:relative!important;}.sidebar-nav-item.active.svelte-13vg9xt{background-color:var(--itd-primary)!important;color:rgb(224 236 255)!important;}.wall-post-form__submit.svelte-vw1v4s{cursor:pointer!important;border:none!important;outline:none!important;font-family:inherit!important;transition:all .2s ease-out!important;background-color:var(--itd-primary)!important;color:rgb(0 0 0)!important;font-weight:900!important;border-radius:9999px!important;}.wall-post-form__toolbar.svelte-vw1v4s{display:flex!important;align-items:center!important;justify-content:space-between!important;margin-top:0.5rem!important;padding-top:0.5rem!important;border-top:1px solid rgba(rgb(0 0 0),.5)!important;}.wall-post-form__attach-btn.svelte-vw1v4s{cursor:pointer!important;border:none!important;outline:none!important;font-family:inherit!important;transition:all .2s ease!important;color:var(--itd-secondary)!important;padding:0.5rem!important;margin-left:-0.5rem!important;border-radius:9999px!important;background:none!important;}.profile-banner__btn.svelte-9mur0y{cursor:pointer!important;border:none!important;outline:none!important;font-family:inherit!important;transition:all .2s ease!important;width:65px!important;height:45px!important;border-radius:9999px!important;background-color:rgb(0 0 0 / 50%)!important;color:rgb(255 255 255)!important;-webkit-backdrop-filter:blur(8px)!important;backdrop-filter:blur(5px)!important;display:flex!important;align-items:center!important;justify-content:center!important;transform:translateY(5px)!important;}.create-post__submit.svelte-1qnpi43{cursor:pointer!important;border:none!important;outline:none!important;font-family:inherit!important;transition:all .2s ease!important;background-color:var(--itd-primary)!important;color:rgb(224 236 255)!important;font-weight:700!important;border-radius:9999px!important;}.create-post__attach-btn.svelte-1qnpi43{cursor:pointer!important;border:none!important;outline:none!important;font-family:inherit!important;transition:all .2s ease!important;color:var(--itd-primary)!important;padding:0.5rem!important;margin-left:-0.5rem!important;border-radius:9999px!important;background:none!important;}.feed-tab.active.svelte-1thmq55{font-weight:700!important;color:var(--color-text)!important;border-bottom:2px solid var(--itd-primary)!important;}.clan-item.is-top-3.svelte-15vxund .clan-item__rank:where(.svelte-15vxund){color:var(--itd-primary)!important;font-weight:700!important;}.clan-item.is-top-3.svelte-15vxund{background:rgba(var(--itd-primary-rgb),0.1)!important;}.hashtag-link.svelte-jp7hc5{color:var(--itd-primary)!important;text-decoration:none!important;font-weight:500!important;}.user-card__follow.svelte-1u9eu0j{cursor:pointer!important;border:none!important;outline:none!important;font-family:inherit!important;transition:all .2s ease!important;background-color:var(--itd-primary)!important;color:rgb(255 255 255)!important;font-weight:700!important;border-radius:9999px!important;}.post-action.like.liked.svelte-1055p8k{color:var(--itd-primary)!important;opacity:1!important;}.post-action.svelte-1055p8k{cursor:pointer!important;border:none!important;outline:none!important;font-family:inherit!important;transition:all .2s ease!important;display:flex!important;align-items:center!important;gap:0.3rem!important;color:rgba(var(--itd-light-rgb),0.9)!important;opacity:.8!important;background:none!important;}.post-views.svelte-1055p8k{display:flex!important;align-items:center!important;gap:0.5rem!important;color:rgba(var(--itd-light-rgb),1)!important;opacity:.4!important;}.original-post__repost-icon.svelte-9y6twa{display:flex!important;align-items:center!important;justify-content:center!important;color:var(--itd-accent)!important;flex-shrink:0!important;}.voice-message.svelte-154nnrp{display:flex!important;align-items:center!important;gap:0.625rem!important;padding:0.5rem 0.75rem!important;background-color:rgb(47 29 50)!important;border-radius:24px!important;max-width:300px!important;min-width:200px!important;transition:background-color .2s ease!important;transition-property:background-color!important;transition-duration:0.2s!important;transition-timing-function:ease!important;transition-delay:0s!important;}.voice-message__play.svelte-154nnrp{cursor:pointer!important;border:none!important;outline:none!important;font-family:inherit!important;transition:all .2s ease!important;width:36px!important;height:36px!important;display:flex!important;align-items:center!important;justify-content:center!important;border-radius:9999px!important;color:var(--color-card)!important;background-color:rgb(100 59 106)!important;flex-shrink:0!important;transition:transform .15s ease,background-color .15s ease!important;}.voice-message__bar.svelte-154nnrp{width:3px!important;min-height:4px!important;border-radius:1.5px!important;background-color:rgb(85 43 92)!important;transition:background-color .1s ease,transform .1s ease!important;flex-shrink:0!important;}.item-action-btn.like.liked.svelte-4g9e7z{color:var(--itd-primary)!important;opacity:1!important;}.explore-clan.is-top-3.svelte-1w567vk{background:rgba(var(--itd-primary-rgb),0.1)!important;}.explore-clan.is-top-3.svelte-1w567vk .explore-clan__rank:where(.svelte-1w567vk){color:var(--itd-primary)!important;font-weight:700!important;}.mobile-nav-item.active.svelte-16uf3bx{color:var(--itd-primary)!important;}.mobile-nav-item.svelte-16uf3bx{width:100%!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:6px!important;padding:0.5rem 0!important;border-radius:999px!important;color:rgb(217 122 238 / 50%)!important;position:relative!important;z-index:1!important;}.fab.svelte-5ery86:hover{transform:scale(1.05)!important;box-shadow:0 6px 16px var(--itd-primary)!important;}.fab.svelte-5ery86{cursor:pointer!important;border:none!important;outline:none!important;font-family:inherit!important;transition:all .2s ease!important;position:fixed!important;bottom:100px!important;right:1rem!important;width:56px!important;height:56px!important;border-radius:9999px!important;background-color:var(--itd-primary)!important;color:rgb(0 0 0)!important;display:flex!important;align-items:center!important;justify-content:center!important;z-index:39!important;transition:transform .3s cubic-bezier(.4,0,.2,1),opacity .3s ease,box-shadow .2s ease!important;}.profile-tab.active.svelte-1r4i2gu:after{content:""!important;position:absolute!important;bottom:0!important;left:50%!important;transform:translate(-50%)!important;width:56px!important;height:4px!important;background-color:var(--itd-primary)!important;border-radius:4px 4px 0 0!important;}.create-post__submit.svelte-1qnpi43:hover{background-color:var(--itd-primary)!important;}.sidebar-logo.svelte-13vg9xt{display:flex!important;align-items:center!important;justify-content:center!important;color:var(--itd-light)!important;transition:opacity .2s ease!important;}.create-post.svelte-1qnpi43{border:2px solid var(--itd-secondary)!important;width:100%!important;border-radius:32px!important;padding:1rem!important;position:relative!important;margin-bottom:16px!important;}.feed-card.svelte-1ooj66h{border-radius:32px!important;border:2px solid var(--itd-secondary)!important;}.feed-tab.svelte-1thmq55{cursor:pointer!important;border:none!important;outline:none!important;font-family:inherit!important;transition:all .2s ease!important;flex:1!important;padding:1rem!important;text-align:center!important;font-weight:500!important;color:rgb(145 145 145)!important;background:none!important;transition:background-color .2s ease,color .2s ease!important;}.post-author.svelte-kvcx9g{font-weight:600!important;font-size:15px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;line-height:1.2!important;color:var(--itd-primary)!important;text-decoration:none!important;}.post-dropdown-item.danger.svelte-kvcx9g{color:var(--itd-light)!important;}.item-author.svelte-4g9e7z{font-weight:600!important;font-size:13px!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;color:var(--itd-primary)!important;text-decoration:none!important;}.item-mention.svelte-4g9e7z{color:var(--itd-accent)!important;font-weight:500!important;text-decoration:none!important;}.show-more-replies.svelte-1m8hxxk{cursor:pointer!important;border:none!important;outline:none!important;font-family:inherit!important;transition:all .2s ease!important;color:rgba(var(--itd-primary-rgb),0.5)!important;font-size:12px!important;font-weight:500!important;text-align:left!important;background:none!important;padding:0!important;}.comments-load-more.svelte-61nzs9{background:none!important;border:none!important;color:rgba(var(--itd-primary-rgb),0.68)!important;font-size:.875rem!important;font-weight:500!important;cursor:pointer!important;padding:0.5rem 0!important;text-align:left!important;}.notifications-tab.active.svelte-1ce0uvz{font-weight:700!important;color:var(--color-text)!important;border-bottom-color:var(--itd-primary)!important;color:var(--itd-light)!important;}.post-modal__views.svelte-1wzwwt5{display:flex!important;align-items:center!important;gap:0.375rem!important;color:rgba(var(--itd-light-rgb),1)!important;opacity:.4!important;font-size:14px!important;}.post-modal__action.svelte-1wzwwt5{cursor:pointer!important;border:none!important;outline:none!important;font-family:inherit!important;transition:all .2s ease!important;display:flex!important;align-items:center!important;gap:0.375rem!important;color:rgba(var(--itd-light-rgb),0.9)!important;opacity:.5!important;background:none!important;font-size:14px!important;}[data-theme=dark]{--color-text:rgb(228 230 232)!important;--color-text-secondary:rgb(138 143 150)!important;--color-text-muted:rgb(106 111 118)!important;--color-background:rgb(17 17 17)!important;--color-card:rgb(14 13 14)!important;--color-border:rgba(var(--itd-primary-rgb),0.4)!important;--color-border-light:rgb(45 48 52 / 80%)!important;--color-border-secondary:var(--itd-secondary)!important;--color-item-bg:rgb(34 25 36)!important;--backdrop-background:rgb(16 18 20 / 92%)!important;--border-color:rgb(45 48 52)!important;--gradient-fade:rgb(16 18 20)!important;--color-input-bg:rgb(30 32 35)!important;--color-tabs-bg:rgb(16 18 20 / 88%)!important;--color-mobile-nav-glow:rgb(37 39 41)!important;}.settings-modal__save.svelte-1jqzo7p{cursor:pointer!important;border:none!important;outline:none!important;font-family:inherit!important;transition:all .2s ease!important;background-color:rgba(var(--itd-primary-rgb),0.8)!important;color:rgb(255 255 255)!important;font-weight:700!important;border-radius:9999px!important;}.settings-modal__toggle.active.svelte-1jqzo7p{background-color:var(--itd-primary)!important;}.settings-modal__option--danger.svelte-1jqzo7p .settings-modal__option-icon:where(.svelte-1jqzo7p){background-color:rgba(var(--itd-accent-rgb),0.1)!important;color:var(--itd-accent)!important;}.settings-modal__option--danger.svelte-1jqzo7p .settings-modal__option-name:where(.svelte-1jqzo7p){color:var(--itd-accent)!important;}.settings-modal__option--danger.svelte-1jqzo7p:hover{background-color:rgba(var(--itd-accent-rgb),0.05)!important;}.settings-modal__option-icon.svelte-1jqzo7p{width:40px!important;height:40px!important;border-radius:9999px!important;background-color:rgba(var(--itd-primary-rgb),0.17)!important;display:flex!important;align-items:center!important;justify-content:center!important;color:var(--color-text)!important;}.post-modal__action.like.liked.svelte-1wzwwt5{color:var(--itd-primary)!important;opacity:1!important;}.hashtag-title.svelte-75az0a{font-size:1.25rem!important;font-weight:700!important;color:var(--itd-light)!important;margin:0!important;}.notification-badge--comment.svelte-1ce0uvz{background-color:var(--itd-primary)!important;}.profile-follow-btn.svelte-p40znu{cursor:pointer!important;border:none!important;outline:none!important;font-family:inherit!important;transition:all .2s ease!important;background-color:var(--itd-primary)!important;color:rgb(0 0 0)!important;font-weight:700!important;border-radius:9999px!important;}.post-container.svelte-cvb24n:not(:last-child){border-bottom:1px solid rgba(var(--itd-primary-rgb),0.52)!important;}.profile-card.svelte-14luta1{background-color:rgb(0 0 0 / 0%)!important;width:100%!important;display:flex!important;flex-direction:column!important;border-radius:0!important;overflow:hidden!important;border:1px solid rgba(var(--itd-primary-rgb),0.52)!important;}.comments-sort-select.svelte-61nzs9{background-color:rgb(50 24 50)!important;border:1px solid var(--itd-secondary)!important;}.item-action-btn.svelte-4g9e7z{font-size:13px!important;}.drawing-btn--save.svelte-12bmgzp{background:rgba(var(--itd-secondary-rgb),0.55)!important;color:rgb(255 255 255)!important;display:flex!important;align-items:center!important;gap:0.5rem!important;}.size-btn.active.svelte-12bmgzp{background:rgba(var(--itd-primary-rgb),0.65)!important;border-color:var(--itd-secondary)!important;color:rgb(255 255 255)!important;}.profile-banner__image.svelte-9mur0y{width:100%!important;height:100%!important;object-fit:cover!important;border-radius:0px!important;}.profile-card.svelte-14luta1{background-color:rgb(0 0 0 / 0%)!important;width:120%!important;display:flex!important;flex-direction:column!important;border-radius:60px!important;overflow:hidden!important;border:1px solid rgba(var(--itd-primary-rgb),0.52)!important;}.explore-header.svelte-1w567vk{display:flex!important;align-items:center!important;gap:1rem!important;padding:0.75rem 10rem!important;border-bottom:1px solid rgb(var(--itd-secondary-rgb))!important;position:sticky!important;top:0!important;background-color:rgba(var(--itd-secondary-rgb),0.3)!important;z-index:10!important;}.explore-search__input.svelte-1w567vk{width:100%!important;background-color:var(--color-input-bg)!important;border:2px solid rgb(0 0 0 / 0%)!important;padding:0.75rem 1rem 0.75rem 3rem!important;border-radius:9999px!important;font-size:15px!important;outline:none!important;color:rgb(255 255 255)!important;transition:border-color .2s ease,background-color .2s ease!important;}.explore-card.svelte-1w567vk{background-color:rgb(0 0 0 / 0%)!important;width:100%!important;display:flex!important;flex-direction:column!important;border-radius:0!important;overflow:hidden!important;min-height:100vh!important;border:1px solid var(--itd-primary)!important;}.explore-section.svelte-1w567vk{padding:0.5rem 0!important;border-bottom:1px solid var(--itd-primary)!important;}.notifications-card.svelte-1ce0uvz{border:1px solid var(--itd-secondary)!important;}.explore-card.svelte-1w567vk{border-radius:50px!important;min-height:auto!important;}.sidebar-top.svelte-13vg9xt{display:flex!important;align-items:center!important;gap:24px!important;flex-direction:column-reverse!important;transform:translateY(-25px)!important;}.notifications-tab.svelte-1ce0uvz{border-bottom:3px solid rgba(var(--itd-primary-rgb),0.35)!important;}.notification-item.svelte-1ce0uvz{border-bottom:1px solid var(--itd-secondary)!important;}.notification-badge--like.svelte-1ce0uvz{background-color:var(--itd-secondary)!important;}.notification-badge--reply.svelte-1ce0uvz{background-color:var(--itd-secondary)!important;}.notification-badge--follow.svelte-1ce0uvz{background-color:var(--itd-secondary)!important;}.notification-badge--repost.svelte-1ce0uvz{background-color:var(--itd-secondary)!important;}.profile-tab.svelte-1r4i2gu{color:var(--itd-light)!important;}.profile-tab.active.svelte-1r4i2gu{font-weight:700!important;color:var(--itd-accent)!important;}.profile-edit-btn.svelte-p40znu{cursor:pointer!important;border:none!important;outline:none!important;font-family:inherit!important;transition:all .2s ease!important;background-color:rgb(0 0 0 / 0%)!important;color:var(--color-text)!important;font-weight:700!important;border:1px solid var(--itd-secondary)!important;border-radius:9999px!important;padding:0.5rem 1.25rem!important;font-size:.875rem!important;transform:translateX(-400px)!important;}.profile-verify-btn.svelte-p40znu{transform:translate(-400px,0)!important;border:1px solid var(--itd-secondary)!important;}.profile-tabs.svelte-1r4i2gu{display:flex!important;margin-top:0.5rem!important;position:sticky!important;top:0!important;background-color:rgba(var(--color-card),.95)!important;z-index:10!important;border-top:1px solid var(--itd-secondary)!important;border-bottom:1px solid var(--itd-secondary)!important;backdrop-filter:blur(8px)!important;-webkit-backdrop-filter:blur(8px)!important;}.wall-post-form.svelte-vw1v4s{border-bottom:1px solid var(--itd-secondary)!important;padding:1rem!important;background-color:rgb(0 0 0 / 0%)!important;}.comment-submit.svelte-ome0nc{background-color:var(--itd-primary)!important;cursor:pointer!important;border:none!important;outline:none!important;font-family:inherit!important;transition:all .2s ease!important;border-radius:24px!important;padding:0.5rem 1rem!important;color:rgb(0 0 0)!important;font-weight:700!important;}.comment-input-field.svelte-ome0nc{flex:1!important;font-size:.875rem!important;padding:0.5rem 0.75rem!important;border:1px solid var(--itd-primary)!important;border-radius:24px!important;outline:none!important;resize:none!important;overflow-y:auto!important;max-height:150px!important;line-height:1.4!important;font-family:inherit!important;background-color:var(--color-input-bg)!important;color:var(--color-text)!important;transition:border-color .2s ease!important;}.comments-sort-select.svelte-61nzs9{background-color:rgb(50 24 50)!important;border:1px solid var(--itd-secondary)!important;color:var(--color-text)!important;padding:0.5rem 0.75rem!important;border-radius:8px!important;font-size:.875rem!important;outline:none!important;cursor:pointer!important;}.original-post.svelte-9y6twa{background-color:rgb(52 47 54)!important;border-radius:16px!important;padding:1rem!important;margin-bottom:1rem!important;}.lazy-image.svelte-ad0ir9{opacity:0!important;transition:opacity .3s ease!important;background-color:rgb(22 20 22)!important;border-radius:8px!important;}.lazy-image.svelte-ad0ir9.loaded{opacity:1!important;}.post-modal__comments.svelte-1wzwwt5{padding:0.75rem 1.25rem 1rem!important;border-top:1px solid var(--itd-primary)!important;background-color:rgba(var(--color-card),0.9)!important;}`;
    function generateCSSWithColors() {
        const colors = getCurrentColorScheme();
        let css = baseCSS;
        const replacements = {
            'var\\(--itd-primary\\)': colors.primary,
            'var\\(--itd-secondary\\)': colors.secondary,
            'var\\(--itd-accent\\)': colors.accent,
            'var\\(--itd-light\\)': colors.light,
            'var\\(--itd-dark\\)': colors.dark,
            'var\\(--itd-primary-rgb\\)': colors.primaryRgb,
            'var\\(--itd-secondary-rgb\\)': colors.secondaryRgb,
            'var\\(--itd-accent-rgb\\)': colors.accentRgb,
            'var\\(--itd-light-rgb\\)': colors.lightRgb,
            'var\\(--itd-dark-rgb\\)': colors.darkRgb
        };
        for (let [pattern, value] of Object.entries(replacements)) {
            css = css.replace(new RegExp(pattern, 'g'), value);
        }
        css = css.replace(/rgba\(var\(--itd-primary-rgb\), ([^)]+)\)/g, `rgba(${colors.primaryRgb}, $1)`);
        css = css.replace(/rgba\(var\(--itd-secondary-rgb\), ([^)]+)\)/g, `rgba(${colors.secondaryRgb}, $1)`);
        css = css.replace(/rgba\(var\(--itd-accent-rgb\), ([^)]+)\)/g, `rgba(${colors.accentRgb}, $1)`);
        css = css.replace(/rgba\(var\(--itd-light-rgb\), ([^)]+)\)/g, `rgba(${colors.lightRgb}, $1)`);
        css = css.replace(/rgba\(var\(--itd-dark-rgb\), ([^)]+)\)/g, `rgba(${colors.darkRgb}, $1)`);
        return css;
    }
    function addStyleTag(id, css) {
        const old = document.getElementById(id);
        if (old) old.remove();
        const style = document.createElement('style');
        style.id = id;
        style.textContent = css;
        document.head.appendChild(style);
    }
    function removeAllStyles() {
        ['itd-all-styles', 'itd-emoji-style', 'noto-emoji-styles', 'itd-modal-styles', 'itd-avatar-styles', 'itd-banner-modal-styles', 'itd-avatar-modal-styles', 'itd-crop-modal-styles', 'cropper-css', 'cropper-js', 'apple-emoji-styles', 'itd-global-fixes'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    }
    function applyAllStyles() {
        removeAllStyles();
        if (!settings.enabled) return;
        addStyleTag('itd-all-styles', generateCSSWithColors());
        if (settings.emojiEnabled) initEmojiSystem();
        else removeEmojiSystem();
        addStyleTag('itd-global-fixes', `.profile-banner__btn-upload, .itd-avatar-overlay, .itd-avatar-upload-btn, .profile-banner__btn-upload *, .profile-banner__btn-upload svg {display: none !important; opacity: 0 !important; pointer-events: none !important;}`);
    }
    function addSettingsButton() {
        if (isSettingsButtonAdded) return;
        const sidebarNav = document.querySelector('.sidebar-nav');
        if (!sidebarNav) {
            setTimeout(addSettingsButton, 1000);
            return;
        }
        if (sidebarNav.querySelector('.sidebar-nav-item.itd-settings')) {
            isSettingsButtonAdded = true;
            return;
        }
        const btn = document.createElement('a');
        btn.className = 'sidebar-nav-item itd-settings';
        btn.href = 'javascript:void(0)';
        btn.title = 'Настройки ИТД+';
        btn.style.cssText = 'display:flex;align-items:center;justify-content:center;';
        btn.innerHTML = '<div class="icon"><img width="32" height="32" src="https://img.icons8.com/deco-color/48/settings.png" alt="settings" style="filter:drop-shadow(0 0 2px rgba(255,255,255,0.3));"></div>';
        btn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            openSettingsModal();
        });
        sidebarNav.appendChild(btn);
        isSettingsButtonAdded = true;
    }
    function toggleDescription(id) {
        expandedDescriptions[id] = !expandedDescriptions[id];
        const desc = document.getElementById(`itd-desc-${id}`);
        const arrow = document.getElementById(`itd-arrow-${id}`);
        if (desc && arrow) {
            if (expandedDescriptions[id]) {
                desc.style.maxHeight = desc.scrollHeight + 'px';
                desc.style.opacity = '1';
                arrow.innerHTML = '▲';
                arrow.style.transform = 'rotate(0deg)';
            } else {
                desc.style.maxHeight = '0';
                desc.style.opacity = '0';
                arrow.innerHTML = '▼';
                arrow.style.transform = 'rotate(0deg)';
            }
        }
    }
    function openSettingsModal() {
        if (currentModal) {
            currentModal.remove();
            currentModal = null;
        }
        const colors = getCurrentColorScheme();
        const modal = document.createElement('div');
        modal.id = 'itd-settings-modal';
        const gearIcon = `<img width="28" height="28" src="https://img.icons8.com/deco-color/48/settings.png" alt="settings" style="filter:drop-shadow(0 0 2px rgba(255,255,255,0.3)); margin-right:8px;">`;
        modal.innerHTML = `<div class="modal-content"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:1px solid ${colors.secondary};padding-bottom:15px;"><h2 style="margin:0;color:${colors.primary};font-size:22px;text-shadow:0 0 10px rgba(${colors.primaryRgb},0.3);display:flex;align-items:center;">${gearIcon} Настройки ИТД+ </h2><button id="itd-modal-close" style="background:rgba(${colors.primaryRgb},0.1);border:1px solid ${colors.primary};color:${colors.primary};cursor:pointer;font-size:24px;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;">✕</button></div><div class="setting-item"><div style="display:flex;align-items:center;justify-content:space-between;width:100%;"><div style="display:flex;align-items:center;gap:10px;"><span style="font-weight:600;font-size:16px;color:${colors.primary};">Включить стили</span><button id="itd-arrow-enabled" style="background:none;border:none;color:${colors.primary};cursor:pointer;font-size:16px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;">${expandedDescriptions.enabled ? '▲' : '▼'}</button></div><label class="toggle-switch"><input type="checkbox" id="itd-enabled" ${settings.enabled ? 'checked' : ''}><span class="toggle-slider"></span></label></div><div id="itd-desc-enabled" class="setting-description" style="max-height:${expandedDescriptions.enabled ? '100px' : '0'};opacity:${expandedDescriptions.enabled ? '1' : '0'};"><div style="margin-top:10px;padding:12px;background:rgba(${colors.secondaryRgb},0.1);border-radius:8px;border-left:3px solid ${colors.primary};font-size:13px;line-height:1.4;">Если цвета не поменялись, нажмите F5 (Fn+5) для перезагрузки страницы.</div></div></div><div class="setting-item"><div style="display:flex;align-items:center;justify-content:space-between;width:100%;"><div style="display:flex;align-items:center;gap:10px;"><span style="font-weight:600;font-size:16px;color:${colors.primary};">Apple Emoji</span><button id="itd-arrow-emoji" style="background:none;border:none;color:${colors.primary};cursor:pointer;font-size:16px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;">${expandedDescriptions.emoji ? '▲' : '▼'}</button></div><label class="toggle-switch"><input type="checkbox" id="itd-emoji" ${settings.emojiEnabled ? 'checked' : ''}><span class="toggle-slider"></span></label></div><div id="itd-desc-emoji" class="setting-description" style="max-height:${expandedDescriptions.emoji ? '100px' : '0'};opacity:${expandedDescriptions.emoji ? '1' : '0'};"><div style="margin-top:10px;padding:12px;background:rgba(${colors.secondaryRgb},0.1);border-radius:8px;border-left:3px solid ${colors.primary};font-size:13px;line-height:1.4;">Используются официальные эмодзи Apple. Могут быть некорректные отображения.</div></div></div><div class="setting-item"><div style="width:100%;"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${expandedDescriptions.colors ? '10px' : '0'};"><div style="display:flex;align-items:center;gap:10px;"><span style="font-weight:600;font-size:16px;color:${colors.primary};">Цветовая схема</span><button id="itd-arrow-colors" style="background:none;border:none;color:${colors.primary};cursor:pointer;font-size:16px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;">${expandedDescriptions.colors ? '▲' : '▼'}</button></div></div><div id="itd-desc-colors" class="setting-description" style="max-height:${expandedDescriptions.colors ? '100px' : '0'};opacity:${expandedDescriptions.colors ? '1' : '0'};margin-bottom:10px;"><div style="padding:12px;background:rgba(${colors.secondaryRgb},0.1);border-radius:8px;border-left:3px solid ${colors.primary};font-size:13px;line-height:1.4;">Баг-репорты: @yetilov_robot</div></div><select id="itd-color-scheme" style="background:rgba(34,25,36,0.8);color:white;border:1px solid ${colors.secondary};border-radius:12px;padding:10px 14px;width:100%;font-size:14px;backdrop-filter:blur(10px);">${Object.keys(colorSchemes).map(s => `<option value="${s}" ${settings.colorScheme === s ? 'selected' : ''}>${colorSchemes[s].name}</option>`).join('')}<option value="custom" ${settings.colorScheme === 'custom' ? 'selected' : ''}>Пользовательский цвет</option></select></div></div><div id="itd-custom-color-container" style="display:${settings.colorScheme === 'custom' ? 'block' : 'none'};margin-top:15px;padding:15px;background:rgba(34,25,36,0.5);border-radius:12px;border:1px solid ${colors.secondary};backdrop-filter:blur(10px);"><div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><span style="font-weight:500;font-size:14px;color:${colors.primary};">Свой цвет:</span><input type="color" id="itd-custom-color-picker" value="${settings.customColor || '#bc50d4'}" style="width:40px;height:40px;border-radius:8px;border:2px solid ${colors.secondary};cursor:pointer;"><input type="text" id="itd-custom-color-input" value="${settings.customColor || '#bc50d4'}" style="flex:1;background:rgba(255,255,255,0.05);color:white;border:1px solid ${colors.secondary};border-radius:8px;padding:8px 12px;font-family:'Consolas',monospace;font-size:13px;backdrop-filter:blur(5px);"></div><div style="font-size:12px;color:rgba(255,255,255,0.6);">HEX-код (например, #ff0000)</div></div><div class="setting-item"><div style="width:100%;"><div style="display:flex;align-items:center;gap:10px;"><span style="font-weight:600;font-size:16px;color:${colors.primary};">Загрузить баннер</span></div><button id="itd-upload-banner" style="background:rgba(${colors.primaryRgb},0.2);border:1px solid ${colors.primary};color:white;padding:8px 16px;border-radius:20px;cursor:pointer;margin-top:8px;">Выбрать изображение/GIF</button><div style="margin-top:8px;font-size:12px;color:rgba(255,255,255,0.6);">отдельное спасибо itd @dix | tg @leha_durov</div><div style="margin-top:4px;font-size:11px;color:rgba(255,255,255,0.4);">Работает хуева</div></div></div><div style="margin-top:20px;padding:15px;background:rgba(34,25,36,0.5);border-radius:15px;border:1px solid ${colors.secondary};backdrop-filter:blur(10px);"><div style="font-weight:600;color:${colors.primary};margin-bottom:12px;font-size:15px;text-shadow:0 0 5px rgba(${colors.primaryRgb},0.2);">🎨 Предпросмотр</div><div style="display:flex;gap:15px;flex-wrap:wrap;"><div style="display:flex;align-items:center;"><div style="background:${colors.primary};width:24px;height:24px;border-radius:6px;margin-right:10px;box-shadow:0 0 8px ${colors.primary};"></div><span style="font-size:14px;color:rgba(255,255,255,0.9);">Основной</span></div><div style="display:flex;align-items:center;"><div style="background:${colors.secondary};width:24px;height:24px;border-radius:6px;margin-right:10px;box-shadow:0 0 8px ${colors.secondary};"></div><span style="font-size:14px;color:rgba(255,255,255,0.9);">Вторичный</span></div><div style="display:flex;align-items:center;"><div style="background:${colors.accent};width:24px;height:24px;border-radius:6px;margin-right:10px;box-shadow:0 0 8px ${colors.accent};"></div><span style="font-size:14px;color:rgba(255,255,255,0.9);">Акцент</span></div></div></div><div style="margin-top:15px;padding:15px;background:rgba(34,25,36,0.5);border-radius:15px;border:1px solid ${colors.secondary};backdrop-filter:blur(10px);"><div style="display:flex;flex-direction:column;gap:8px;"><div style="font-weight:700;font-size:18px;color:${colors.primary};">ИТД+ v2.20.20</div><div style="font-size:14px;color:rgba(255,255,255,0.8);">Bag Fix</div><div style="margin-top:8px;font-size:13px;color:rgba(255,255,255,0.6);font-style:italic;">⚡ Улучшена работа emoji</div><div style="margin-top:12px;font-size:13px;color:rgba(255,255,255,0.6);">2020-2026 <a href="https://t.me/vcb_code" target="_blank" style="color:${colors.primary};text-decoration:none;border-bottom:1px solid ${colors.primary};">VCB</a></div></div></div><div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px;"><button id="itd-reset-colors" style="background:transparent;color:${colors.primary};border:1px solid ${colors.primary};padding:12px 22px;border-radius:25px;font-weight:600;cursor:pointer;font-size:14px;">Сброс</button><button id="itd-save-settings" style="background:linear-gradient(135deg,${colors.primary},${colors.accent});color:white;border:none;padding:12px 28px;border-radius:25px;font-weight:600;cursor:pointer;font-size:14px;box-shadow:0 4px 15px rgba(${colors.primaryRgb},0.3);">Сохранить</button></div></div>`;
        const modalStyles = `#itd-settings-modal{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:999999;backdrop-filter:blur(8px);animation:itdFadeIn 0.2s ease;}#itd-settings-modal .modal-content{background:rgba(14,13,14,0.85);border:1px solid rgba(${colors.secondaryRgb},0.4);border-radius:28px;padding:36px;width:720px;height:720px;color:white;font-family:Inter,sans-serif;position:relative;overflow-y:auto;backdrop-filter:blur(20px);box-shadow:0 20px 60px rgba(0,0,0,0.5);animation:itdScaleIn 0.25s cubic-bezier(0.16,1,0.3,1);}#itd-settings-modal .setting-item{display:flex;flex-direction:column;align-items:flex-start;margin-bottom:16px;padding:16px;border-radius:16px;background:rgba(34,25,36,0.6);border:1px solid transparent;transition:all 0.15s ease;}#itd-settings-modal .setting-item:hover{background:rgba(50,24,50,0.7);border-color:rgba(${colors.primaryRgb},0.2);transform:translateY(-1px);}.setting-description{overflow:hidden;transition:all 0.25s cubic-bezier(0.16,1,0.3,1);width:100%;}#itd-settings-modal .toggle-switch{position:relative;width:52px;height:26px;margin-left:10px;}#itd-settings-modal .toggle-switch input{opacity:0;width:0;height:0;}#itd-settings-modal .toggle-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background-color:rgba(255,255,255,0.1);border-radius:34px;transition:.2s;border:1px solid rgba(255,255,255,0.2);}#itd-settings-modal .toggle-slider:before{position:absolute;content:"";height:20px;width:20px;left:2px;bottom:2px;background-color:white;border-radius:50%;transition:.2s;box-shadow:0 2px 5px rgba(0,0,0,0.2);}#itd-settings-modal input:checked+.toggle-slider{background-color:${colors.primary};box-shadow:0 0 10px ${colors.primary};}#itd-settings-modal input:checked+.toggle-slider:before{transform:translateX(26px);}#itd-settings-modal::-webkit-scrollbar{width:6px;}#itd-settings-modal::-webkit-scrollbar-track{background:rgba(0,0,0,0.1);border-radius:4px;}#itd-settings-modal::-webkit-scrollbar-thumb{background:${colors.primary};border-radius:4px;}@keyframes itdFadeIn{from{opacity:0;}to{opacity:1;}}@keyframes itdScaleIn{from{transform:scale(0.96);opacity:0;}to{transform:scale(1);opacity:1;}}`;
        addStyleTag('itd-modal-styles', modalStyles);
        document.body.appendChild(modal);
        currentModal = modal;
        modal.querySelector('#itd-arrow-enabled')?.addEventListener('click', () => toggleDescription('enabled'));
        modal.querySelector('#itd-arrow-emoji')?.addEventListener('click', () => toggleDescription('emoji'));
        modal.querySelector('#itd-arrow-colors')?.addEventListener('click', () => toggleDescription('colors'));
        const colorSchemeSelect = modal.querySelector('#itd-color-scheme');
        const customColorContainer = modal.querySelector('#itd-custom-color-container');
        const customColorPicker = modal.querySelector('#itd-custom-color-picker');
        const customColorInput = modal.querySelector('#itd-custom-color-input');
        colorSchemeSelect?.addEventListener('change', function() {
            customColorContainer.style.display = this.value === 'custom' ? 'block' : 'none';
        });
        customColorPicker?.addEventListener('input', function() {
            customColorInput.value = this.value;
        });
        customColorInput?.addEventListener('input', function() {
            let color = this.value.startsWith('#') ? this.value : '#' + this.value;
            if (/^#[0-9A-F]{6}$/i.test(color) || /^#[0-9A-F]{3}$/i.test(color)) {
                customColorPicker.value = color;
            }
        });
        modal.querySelector('#itd-modal-close')?.addEventListener('click', () => {
            modal.remove();
            currentModal = null;
        });
        modal.querySelector('#itd-reset-colors')?.addEventListener('click', () => {
            settings.colorScheme = 'purple';
            settings.customColor = '#bc50d4';
            saveSettings();
            applyAllStyles();
            showNotification('Цвета сброшены');
            modal.remove();
            currentModal = null;
            setTimeout(openSettingsModal, 50);
        });
        modal.querySelector('#itd-save-settings')?.addEventListener('click', () => {
            const enabledCheckbox = document.getElementById('itd-enabled');
            const emojiCheckbox = document.getElementById('itd-emoji');
            const colorSchemeSelect = document.getElementById('itd-color-scheme');
            const customColorInput = document.getElementById('itd-custom-color-input');
            if (enabledCheckbox && emojiCheckbox && colorSchemeSelect) {
                settings.enabled = enabledCheckbox.checked;
                settings.emojiEnabled = emojiCheckbox.checked;
                settings.colorScheme = colorSchemeSelect.value;
                if (settings.colorScheme === 'custom') {
                    const val = customColorInput ? customColorInput.value : '#bc50d4';
                    settings.customColor = val.startsWith('#') ? val : '#' + val;
                }
                saveSettings();
                applyAllStyles();
                showNotification('Настройки сохранены');
                modal.remove();
                currentModal = null;
            }
        });
        modal.querySelector('#itd-upload-banner')?.addEventListener('click', () => {
            const canvas = document.querySelector('.drawing-canvas');
            if (!canvas) {
                showNotification('Сначала открой редактор баннера > Изменить баннер', true);
                return;
            }
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*,image/gif";
            input.onchange = () => {
                const file = input.files[0];
                if (!file) return;
                const img = new Image();
                img.src = URL.createObjectURL(file);
                img.onload = () => {
                    const ctx = canvas.getContext("2d");
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    URL.revokeObjectURL(img.src);
                    showNotification('Баннер загружен (первый кадр GIF)');
                };
                img.onerror = () => {
                    showNotification('Ошибка загрузки изображения', true);
                    URL.revokeObjectURL(img.src);
                };
            };
            input.click();
        });
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                modal.remove();
                currentModal = null;
            }
        });
    }
    function addBannerButtonToEditor() {
        const editorContainer = document.querySelector('.drawing-canvas')?.closest('.drawing-editor');
        if (!editorContainer) return;
        if (editorContainer.querySelector('.itd-banner-upload-btn')) return;
        const toolbar = editorContainer.querySelector('.drawing-toolbar') || editorContainer;
        const colors = getCurrentColorScheme();
        const btn = document.createElement('button');
        btn.className = 'itd-banner-upload-btn drawing-btn';
        btn.textContent = '📁 Загрузить GIF';
        btn.style.cssText = `background:rgba(${colors.primaryRgb},0.2);border:1px solid ${colors.primary};color:white;padding:8px 12px;border-radius:20px;cursor:pointer;margin:4px;`;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const canvas = editorContainer.querySelector('.drawing-canvas');
            if (!canvas) {
                showNotification('Canvas пидорас и не работает', true);
                return;
            }
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*,image/gif";
            input.onchange = () => {
                const file = input.files[0];
                if (!file) return;
                const img = new Image();
                img.src = URL.createObjectURL(file);
                img.onload = () => {
                    const ctx = canvas.getContext("2d");
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    URL.revokeObjectURL(img.src);
                    showNotification('Баннер загружен (первый кадр гиф, дальше мне лень)');
                };
                img.onerror = () => {
                    showNotification('Ошибка загрузки изображения', true);
                    URL.revokeObjectURL(img.src);
                };
            };
            input.click();
        });
        toolbar.appendChild(btn);
    }
    function initBannerButtonObserver() {
        if (bannerButtonObserver) return;
        bannerButtonObserver = new MutationObserver(() => {
            if (document.querySelector('.drawing-canvas')) {
                addBannerButtonToEditor();
            }
        });
        bannerButtonObserver.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => {
            if (document.querySelector('.drawing-canvas')) addBannerButtonToEditor();
        }, 1000);
    }
    function initEmojiSystem() {
        if (!settings.emojiEnabled) return removeEmojiSystem();
        removeEmojiSystem();

        const emojiStyle = document.createElement('style');
        emojiStyle.id = 'apple-emoji-styles';
        emojiStyle.textContent = `
            .apple-emoji{font-size:inherit!important;line-height:inherit!important;vertical-align:text-bottom!important;display:inline-block!important;}
            .apple-emoji-container{display:inline-block;line-height:inherit;}
            .apple-emoji{position:relative;top:0.1em;}
        `;
        document.head.appendChild(emojiStyle);
        const emojiConfig = {
            emojiSource: 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64',
            imageFormat: 'png',
            excludeSelectors: ['script', 'style', 'textarea', 'input', 'code', 'pre', '.no-emoji', '[data-no-emoji]', '[contenteditable="true"]']
        };
        const emojiCache = new Map();
        function normalizeEmojiCode(code) {
            return code.replace(/-fe0f/g, '').replace(/fe0f-?/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
        }
        function getEmojiCode(emojiChar) {
            try {
                if (/^\d$/.test(emojiChar)) return null;
                if (/^[#@$%^&*()_+\-=\[\]{}|;:,.<>?\/\\`~]$/.test(emojiChar)) return null;
                if (/^[a-zA-Zа-яА-ЯёЁ0-9\s.,!?;:'"()\-+=\[\]{}]$/.test(emojiChar)) return null;
                let fullCode = '';
                for (let i = 0; i < emojiChar.length; i++) {
                    const codePoint = emojiChar.codePointAt(i);
                    if (!codePoint) continue;
                    let charCode = codePoint.toString(16).toLowerCase();
                    if (charCode) {
                        fullCode += (fullCode ? '-' : '') + charCode;
                        if (codePoint > 0xFFFF) i++;
                    }
                }
                return normalizeEmojiCode(fullCode);
            } catch {
                return null;
            }
        }
        function getAppleEmojiUrl(emojiCode) {
            if (!emojiCode) return null;
            return `${emojiConfig.emojiSource}/${emojiCode}.${emojiConfig.imageFormat}`;
        }
        function shouldProcessEmojiElement(element) {
            if (!element || !element.textContent) return false;
            for (const sel of emojiConfig.excludeSelectors) {
                if (element.closest(sel)) return false;
            }
            const text = element.textContent;
            if (/^[\d#@$%^&*()_+\-=\[\]{}|;:,.<>?\/\\`~]+$/.test(text.trim())) return false;
            const emojiRegex = /([\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}])(?:\u200D[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}])*|[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}]/gu;
            return emojiRegex.test(text);
        }
        function createEmojiElement(emojiChar) {
            const emojiCode = getEmojiCode(emojiChar);
            if (!emojiCode) return document.createTextNode(emojiChar);
            if (emojiCache.has(emojiChar)) {
                return emojiCache.get(emojiChar).cloneNode(true);
            }
            const emojiUrl = getAppleEmojiUrl(emojiCode);
            if (!emojiUrl) return document.createTextNode(emojiChar);
            const container = document.createElement('span');
            container.className = 'apple-emoji-container';
            container.setAttribute('data-emoji', emojiChar);
            container.setAttribute('data-emoji-code', emojiCode);
            const img = document.createElement('img');
            img.src = emojiUrl;
            img.alt = emojiChar;
            img.className = 'apple-emoji';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.style.cssText = 'display:inline-block;vertical-align:text-bottom;font-size:inherit;line-height:inherit;height:1.2em;width:auto;max-width:1.2em;min-width:1em;object-fit:contain;margin:0 0.05em;';
            img.onerror = () => {
                const fallbackUrl = `${emojiConfig.emojiSource}/${emojiCode.replace(/-/g, '')}.${emojiConfig.imageFormat}`;
                if (img.src !== fallbackUrl) {
                    img.src = fallbackUrl;
                } else {
                    img.replaceWith(document.createTextNode(emojiChar));
                }
            };
            container.appendChild(img);
            emojiCache.set(emojiChar, container.cloneNode(true));
            return container;
        }
        function processEmojiTextNode(textNode) {
            if (!textNode || !textNode.textContent || !shouldProcessEmojiElement(textNode.parentElement)) return false;
            const text = textNode.textContent;
            const emojiRegex = /([\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}])(?:\u200D[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}])*|[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}]/gu;
            const matches = [...text.matchAll(emojiRegex)];
            if (matches.length === 0) return false;
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            for (const match of matches) {
                const emoji = match[0];
                const index = match.index;
                if (index > lastIndex) {
                    fragment.appendChild(document.createTextNode(text.substring(lastIndex, index)));
                }
                fragment.appendChild(createEmojiElement(emoji));
                lastIndex = index + emoji.length;
            }
            if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            }
            try {
                textNode.parentNode.replaceChild(fragment, textNode);
                return true;
            } catch {
                return false;
            }
        }
        processEmojiDOM = function processEmojiDOM(rootElement = document.body) {
            if (!rootElement) return 0;
            let count = 0;
            const walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT, {
                acceptNode: node => shouldProcessEmojiElement(node.parentElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
            });
            const nodes = [];
            let node;
            while (node = walker.nextNode()) nodes.push(node);
            for (let i = nodes.length - 1; i >= 0; i--) {
                if (processEmojiTextNode(nodes[i])) count++;
            }
            return count;
        };
        let timeoutId = null;
        if (emojiObserver) emojiObserver.disconnect();
        emojiObserver = new MutationObserver(() => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => processEmojiDOM(), 100);
        });
        emojiObserver.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => processEmojiDOM(), 500);
    }
    function removeEmojiSystem() {
        document.getElementById('apple-emoji-styles')?.remove();
        if (emojiObserver) {
            emojiObserver.disconnect();
            emojiObserver = null;
        }
        document.querySelectorAll('.apple-emoji-container').forEach(c => {
            const emoji = c.getAttribute('data-emoji');
            if (emoji) c.replaceWith(document.createTextNode(emoji));
        });
        processEmojiDOM = null;
    }
    function showNotification(text, isError = false) {
        document.querySelectorAll('.itd-notification').forEach(el => el.remove());
        const colors = getCurrentColorScheme();
        const notification = document.createElement('div');
        notification.className = 'itd-notification';
        notification.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);background:${isError ? 'rgba(220,53,69,0.9)' : `rgba(${colors.primaryRgb},0.9)`};color:white;padding:12px 24px;border-radius:40px;font-family:Inter,sans-serif;font-weight:500;z-index:1000000;animation:itdSlideDown 0.2s ease;box-shadow:0 10px 25px rgba(0,0,0,0.3);border:1px solid ${colors.secondary};backdrop-filter:blur(10px);text-align:center;white-space:nowrap;max-width:90%;font-size:14px;display:flex;align-items:center;gap:8px;`;
        const icon = document.createElement('span');
        icon.innerHTML = isError ? '❌' : '✅';
        icon.style.fontSize = '16px';
        notification.prepend(icon);
        notification.appendChild(document.createTextNode(text));
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'itdFadeOut 0.15s ease forwards';
            setTimeout(() => notification.remove(), 150);
        }, CONFIG.NOTIFICATION_DURATION);
    }
    function hideEmojiPickerWithDelay(delay = 300) {
        if (emojiPickerHideTimer) clearTimeout(emojiPickerHideTimer);
        emojiPickerHideTimer = setTimeout(() => {
            if (emojiPickerElement) {
                emojiPickerElement.remove();
                emojiPickerElement = null;
                emojiPickerActive = false;
                emojiPickerCurrentButton = null;
            }
        }, delay);
    }
    function cancelHideTimer() {
        if (emojiPickerHideTimer) {
            clearTimeout(emojiPickerHideTimer);
            emojiPickerHideTimer = null;
        }
    }
    function showEmojiPickerOnHover(button, field) {
        if (emojiPickerElement) {
            activeEmojiField = field;
            emojiPickerCurrentButton = button;
            cancelHideTimer();
            return;
        }
        activeEmojiField = field;
        emojiPickerCurrentButton = button;
        const colors = getCurrentColorScheme();
        const picker = document.createElement('div');
        picker.className = 'itd-emoji-picker';
        picker.style.cssText = `position:fixed;background:rgba(14,13,14,0.95);border:1px solid ${colors.secondary};border-radius:20px;padding:15px;width:500px;max-height:450px;overflow-y:auto;z-index:1000000;backdrop-filter:blur(10px);box-shadow:0 10px 30px rgba(0,0,0,0.5);`;
        const header = document.createElement('div');
        header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid rgba(255,255,255,0.2);';
        const title = document.createElement('span');
        title.textContent = 'Выберите эмодзи';
        title.style.cssText = 'color:white;font-weight:600;';
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `background:none;border:none;color:${colors.primary};font-size:22px;cursor:pointer;padding:0 8px;`;
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            picker.remove();
            emojiPickerElement = null;
            emojiPickerActive = false;
        });
        header.appendChild(title);
        header.appendChild(closeBtn);
        picker.appendChild(header);
        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(8,1fr);gap:8px;';
        const emojiList = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃'];
        emojiList.forEach(emoji => {
            const span = document.createElement('span');
            span.textContent = emoji;
            span.style.cssText = 'font-size:28px;cursor:pointer;padding:6px;border-radius:8px;text-align:center;transition:background 0.1s;';
            span.addEventListener('mouseenter', () => {
                span.style.background = colors.primary + '40';
            });
            span.addEventListener('mouseleave', () => {
                span.style.background = 'none';
            });
            span.addEventListener('click', () => {
                if (activeEmojiField) {
                    if (activeEmojiField.isContentEditable) {
                        document.execCommand('insertText', false, emoji + ' ');
                    } else {
                        const start = activeEmojiField.selectionStart;
                        const end = activeEmojiField.selectionEnd;
                        const val = activeEmojiField.value;
                        activeEmojiField.value = val.substring(0, start) + emoji + ' ' + val.substring(end);
                        activeEmojiField.selectionStart = activeEmojiField.selectionEnd = start + emoji.length + 1;
                        activeEmojiField.focus();
                    }
                }
            });
            grid.appendChild(span);
        });
        picker.appendChild(grid);
        picker.addEventListener('mouseenter', () => cancelHideTimer());
        picker.addEventListener('mouseleave', () => hideEmojiPickerWithDelay(300));
        document.body.appendChild(picker);
        emojiPickerElement = picker;
        emojiPickerActive = true;
        const rect = button.getBoundingClientRect();
        const pickerHeight = picker.offsetHeight || 400;
        let top = rect.bottom + window.scrollY + 5;
        if (top + pickerHeight > window.scrollY + window.innerHeight) {
            top = rect.top + window.scrollY - pickerHeight - 5;
        }
        let left = rect.left + window.scrollX - 250;
        if (left < 10) left = 10;
        if (left + 500 > window.innerWidth - 10) left = window.innerWidth - 510;
        picker.style.top = top + 'px';
        picker.style.left = left + 'px';
    }
    function addEmojiPickerButton() {
        const postSelectors = ['.create-post', '.wall-post-form'];
        postSelectors.forEach(selector => {
            const container = document.querySelector(selector);
            if (!container) return;
            const toolbar = container.querySelector('.create-post__attach, .wall-post-form__attach');
            if (toolbar && !toolbar.querySelector('.itd-emoji-picker-btn')) {
                const colors = getCurrentColorScheme();
                const btn = document.createElement('button');
                btn.className = 'itd-emoji-picker-btn';
                const existingBtn = toolbar.querySelector('button');
                if (existingBtn) btn.classList.add(...existingBtn.classList);
                else btn.classList.add('create-post__attach-btn');
                btn.title = 'Выбрать эмодзи';
                btn.innerHTML = '😀';
                btn.style.cssText = `font-size:20px;padding:0.5rem;background:none;border:none;color:${colors.primary};cursor:pointer;`;
                const getField = () => {
                    if (selector === '.create-post') {
                        return container.querySelector('.create-post__editor[contenteditable="true"]');
                    } else {
                        return container.querySelector('.wall-post-form__editor[contenteditable="true"]');
                    }
                };
                btn.addEventListener('mouseenter', () => {
                    const field = getField();
                    if (!field) return;
                    showEmojiPickerOnHover(btn, field);
                });
                btn.addEventListener('mouseleave', () => {
                    hideEmojiPickerWithDelay(300);
                });
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const field = getField();
                    if (!field) return;
                    if (emojiPickerElement) {
                        emojiPickerElement.remove();
                        emojiPickerElement = null;
                        emojiPickerActive = false;
                    } else {
                        showEmojiPickerOnHover(btn, field);
                    }
                });
                toolbar.appendChild(btn);
            }
        });
        const commentForm = document.querySelector('.comment-input-form');
        if (commentForm && !commentForm.querySelector('.itd-emoji-picker-btn')) {
            const colors = getCurrentColorScheme();
            const btn = document.createElement('button');
            btn.className = 'itd-emoji-picker-btn comment-attach-btn';
            btn.title = 'Выбрать эмодзи';
            btn.innerHTML = '😀';
            btn.style.cssText = `font-size:20px;padding:0.375rem;background:none;border:none;color:${colors.primary};cursor:pointer;`;
            const getField = () => commentForm.querySelector('textarea.comment-input-field');
            btn.addEventListener('mouseenter', () => {
                const field = getField();
                if (!field) return;
                showEmojiPickerOnHover(btn, field);
            });
            btn.addEventListener('mouseleave', () => {
                hideEmojiPickerWithDelay(300);
            });
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const field = getField();
                if (!field) return;
                if (emojiPickerElement) {
                    emojiPickerElement.remove();
                    emojiPickerElement = null;
                    emojiPickerActive = false;
                } else {
                    showEmojiPickerOnHover(btn, field);
                }
            });
            const attachBtn = commentForm.querySelector('.comment-attach-btn');
            if (attachBtn) attachBtn.parentNode.insertBefore(btn, attachBtn.nextSibling);
            else commentForm.insertBefore(btn, commentForm.firstChild);
        }
    }
    function initEmojiPickerObserver() {
        const observer = new MutationObserver(() => {
            addEmojiPickerButton();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(addEmojiPickerButton, 500);
        setInterval(addEmojiPickerButton, 2000);
    }
    function startPeriodicCheck() {
        setInterval(() => {
            if (!isSettingsButtonAdded) addSettingsButton();
        }, CONFIG.CHECK_INTERVAL);
    }
    function init() {
        applyAllStyles();
        setTimeout(addSettingsButton, 800);
        startPeriodicCheck();
        initBannerButtonObserver();
        initEmojiPickerObserver();
        if (typeof GM_registerMenuCommand !== 'undefined') {
            GM_registerMenuCommand('⚙️ Настройки ИТД+', openSettingsModal);
            GM_registerMenuCommand('🎨 Сбросить цвета', () => {
                settings.colorScheme = 'purple';
                settings.customColor = '#bc50d4';
                saveSettings();
                applyAllStyles();
                showNotification('Сброшено');
            });
        }
    }

    init();
})();
