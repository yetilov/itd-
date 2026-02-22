// ==UserScript==
// @name         ИТД+ (исправленный плеер, оптимизированный)
// @namespace    http://tampermonkey.net/
// @version      v2.5.1
// @description  Мини-плеер с автопереключением, всегда виден, можно закрыть. Загрузка треков только из плеера.
// @author       ITD: @VCB / TG: @VCB_CODE (мод.)
// @match        https://xn--d1ah4a.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=xn--d1ah4a.com
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// @require      https://cdnjs.cloudflare.com/ajax/libs/jsmediatags/3.9.5/jsmediatags.min.js
// @updateURL    https://github.com/yetilov/itd-/raw/refs/heads/main/itd_plus.user.js
// @downloadURL  https://github.com/yetilov/itd-/raw/refs/heads/main/itd_plus.user.js
// ==/UserScript==

(function() {
    'use strict';

    function hideEmojiPickerWithDelay(delay = 300) {
        if (emojiPickerHideTimer) clearTimeout(emojiPickerHideTimer);
        emojiPickerHideTimer = setTimeout(() => {
            if (emojiPickerElement) { emojiPickerElement.remove(); emojiPickerElement = null; emojiPickerActive = false; emojiPickerCurrentButton = null; }
        }, delay);
    }

    function cancelHideTimer() {
        if (emojiPickerHideTimer) { clearTimeout(emojiPickerHideTimer); emojiPickerHideTimer = null; }
    }

    function showEmojiPickerOnHover(button, field) {
        if (emojiPickerElement) { activeEmojiField = field; emojiPickerCurrentButton = button; cancelHideTimer(); return; }
        activeEmojiField = field; emojiPickerCurrentButton = button;
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
        closeBtn.addEventListener('click', e => { e.stopPropagation(); picker.remove(); emojiPickerElement = null; emojiPickerActive = false; });
        header.appendChild(title); header.appendChild(closeBtn); picker.appendChild(header);

        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:repeat(8,1fr);gap:8px;';
        const emojiList = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖','🎃','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','💯','🔥','✨','⭐','🌟','💫','🎵','🎶','🎉','🎊','🎈','🍕','🍔','🍟','🌮','🌯','🍜','🍣','🍩','🍪','🎂','🍰','☕','🧋','🥂','🍷'];
        emojiList.forEach(emoji => {
            const span = document.createElement('span');
            span.textContent = emoji;
            span.style.cssText = 'font-size:28px;cursor:pointer;padding:6px;border-radius:8px;text-align:center;transition:background 0.1s;';
            span.addEventListener('mouseenter', () => { span.style.background = colors.primary + '40'; });
            span.addEventListener('mouseleave', () => { span.style.background = 'none'; });
            span.addEventListener('click', () => {
                if (!activeEmojiField) return;
                if (activeEmojiField.isContentEditable) {
                    document.execCommand('insertText', false, emoji + ' ');
                } else {
                    const s = activeEmojiField.selectionStart, e2 = activeEmojiField.selectionEnd;
                    activeEmojiField.value = activeEmojiField.value.substring(0, s) + emoji + ' ' + activeEmojiField.value.substring(e2);
                    activeEmojiField.selectionStart = activeEmojiField.selectionEnd = s + emoji.length + 1;
                    activeEmojiField.focus();
                }
            });
            grid.appendChild(span);
        });
        picker.appendChild(grid);
        picker.addEventListener('mouseenter', () => cancelHideTimer());
        picker.addEventListener('mouseleave', () => hideEmojiPickerWithDelay(300));
        document.body.appendChild(picker);
        emojiPickerElement = picker; emojiPickerActive = true;

        const rect = button.getBoundingClientRect();
        const pickerHeight = picker.offsetHeight || 400;
        let top = rect.bottom + window.scrollY + 5;
        if (top + pickerHeight > window.scrollY + window.innerHeight) top = rect.top + window.scrollY - pickerHeight - 5;
        let left = rect.left + window.scrollX - 250;
        if (left < 10) left = 10;
        if (left + 500 > window.innerWidth - 10) left = window.innerWidth - 510;
        picker.style.top = top + 'px'; picker.style.left = left + 'px';
    }

    function addEmojiPickerButton() {
        if (!settings.emojiEnabled) return;
        ['.create-post', '.wall-post-form'].forEach(selector => {
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
                btn.title = 'Выбрать эмодзи'; btn.innerHTML = '😀';
                btn.style.cssText = `font-size:20px;padding:0.5rem;background:none;border:none;color:${colors.primary};cursor:pointer;`;
                const getField = () => selector === '.create-post'
                    ? container.querySelector('.create-post__editor[contenteditable="true"]')
                    : container.querySelector('.wall-post-form__editor[contenteditable="true"]');
                btn.addEventListener('mouseenter', () => { const f = getField(); if (f) showEmojiPickerOnHover(btn, f); });
                btn.addEventListener('mouseleave', () => hideEmojiPickerWithDelay(300));
                btn.addEventListener('click', e => {
                    e.preventDefault(); e.stopPropagation();
                    const f = getField(); if (!f) return;
                    if (emojiPickerElement) { emojiPickerElement.remove(); emojiPickerElement = null; emojiPickerActive = false; }
                    else showEmojiPickerOnHover(btn, f);
                });
                toolbar.appendChild(btn);
            }
        });

        const commentForm = document.querySelector('.comment-input-form');
        if (commentForm && !commentForm.querySelector('.itd-emoji-picker-btn')) {
            const colors = getCurrentColorScheme();
            const btn = document.createElement('button');
            btn.className = 'itd-emoji-picker-btn comment-attach-btn';
            btn.title = 'Выбрать эмодзи'; btn.innerHTML = '😀';
            btn.style.cssText = `font-size:20px;padding:0.375rem;background:none;border:none;color:${colors.primary};cursor:pointer;`;
            const getField = () => commentForm.querySelector('textarea.comment-input-field');
            btn.addEventListener('mouseenter', () => { const f = getField(); if (f) showEmojiPickerOnHover(btn, f); });
            btn.addEventListener('mouseleave', () => hideEmojiPickerWithDelay(300));
            btn.addEventListener('click', e => {
                e.preventDefault(); e.stopPropagation();
                const f = getField(); if (!f) return;
                if (emojiPickerElement) { emojiPickerElement.remove(); emojiPickerElement = null; emojiPickerActive = false; }
                else showEmojiPickerOnHover(btn, f);
            });
            const attachBtn = commentForm.querySelector('.comment-attach-btn');
            if (attachBtn) attachBtn.parentNode.insertBefore(btn, attachBtn.nextSibling);
            else commentForm.insertBefore(btn, commentForm.firstChild);
        }
    }

    function initEmojiPickerObserver() {
        const observer = new MutationObserver(() => addEmojiPickerButton());
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(addEmojiPickerButton, 500);
        setInterval(addEmojiPickerButton, 2000);
    }

    function loadMaterialIcons() {
        if (!document.querySelector('link[href*="material-icons"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
            document.head.appendChild(link);
        }
    }
    loadMaterialIcons();

    window.interceptedRequests = window.interceptedRequests || [];
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const [url, options = {}] = args;
        const requestInfo = {
            url,
            method: options.method || 'GET',
            headers: options.headers || {},
            body: options.body,
            timestamp: Date.now()
        };
        window.interceptedRequests.push(requestInfo);
        return originalFetch.apply(this, args);
    };

    const CONFIG = {
        CHECK_INTERVAL: 2000,
        NOTIFICATION_DURATION: 5000,
        AD_BLOCK_INTERVAL: 640000
    };

    const defaultSettings = {
        enabled: true,
        emojiEnabled: true,
        colorScheme: 'purple',
        customColor: '#bc50d4',
        shuffle: false,
        lastTrackId: null,
        playerVisible: true
    };

    const colorSchemes = {
        purple: { name: 'Фиолетовая (стандартная)', primary: '#bc50d4', secondary: '#9c27b0', accent: '#b450d4', light: '#d47de8', dark: '#8a2be2' },
        blue: { name: 'Синяя', primary: '#4285f4', secondary: '#1a73e8', accent: '#5c9bf2', light: '#8ab4f8', dark: '#0d47a1' },
        green: { name: 'Зелёная', primary: '#34a853', secondary: '#2e7d32', accent: '#4caf50', light: '#81c784', dark: '#1b5e20' },
        red: { name: 'Красная', primary: '#ea4335', secondary: '#d32f2f', accent: '#f44336', light: '#ef9a9a', dark: '#b71c1c' },
        orange: { name: 'Оранжевая', primary: '#f57c00', secondary: '#ef6c00', accent: '#ff9800', light: '#ffb74d', dark: '#e65100' },
        teal: { name: 'Бирюзовая', primary: '#009688', secondary: '#00796b', accent: '#4db6ac', light: '#80cbc4', dark: '#004d40' }
    };

    let settings = loadSettings();
    let isSettingsButtonAdded = false;
    let isPlayerToggleButtonAdded = false;
    let currentModal = null;
    let miniPlayer = null;
    let trackListPopup = null;
    let expandedDescriptions = { enabled: false, emoji: false, colors: false };
    let adBlockTimerId = null;
    let adBlockLastClosedTime = 0;
    let commentsObserver = null;

    let tracks = [];
    let currentTrackIndex = -1;
    let shuffle = settings.shuffle || false;
    const audioElement = document.createElement('audio');
    audioElement.id = 'itd-global-audio';
    audioElement.style.display = 'none';
    document.body.appendChild(audioElement);
    let db = null;
    let isPlayerMinimized = false;

    let emojiObserver = null;
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

    function formatTime(sec) {
        if (!sec || isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
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
        if (!settings.enabled) {
            const adBlock = document.querySelector('.itd-ad-block');
            if (adBlock) adBlock.remove();
            return;
        }
        addStyleTag('itd-all-styles', generateCSSWithColors());
        if (settings.emojiEnabled) initEmojiSystem();
        else removeEmojiSystem();
        addStyleTag('itd-global-fixes', `.profile-banner__btn-upload, .itd-avatar-overlay, .itd-avatar-upload-btn, .profile-banner__btn-upload *, .profile-banner__btn-upload svg {display: none !important; opacity: 0 !important; pointer-events: none !important;}`);
        refreshAdBlock();
    }

    function generateAdBlockHTML(colors) {
        return `
            <div style="position: fixed; bottom: 20px; left: 20px; width: 280px; border-radius: 20px; background: rgba(34,25,36,0.8); border: 2px solid ${colors.secondary}; backdrop-filter: blur(12px); padding: 16px; color: white; font-family: Inter, sans-serif; box-sizing: border-box; z-index: 99999; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: 700; font-size: 18px; color: ${colors.primary};">Телеграм канал автора</span>
                    <button class="itd-ad-close" style="background: none; border: none; color: ${colors.primary}; font-size: 28px; cursor: pointer; line-height: 1; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">&times;</button>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <a href="https://t.me/vcb_code" target="_blank" style="color: ${colors.primary}; text-decoration: none; font-weight: 600; font-size: 20px; border-bottom: 2px solid ${colors.primary};">@vcb_code</a>
                    <img src="https://cdn-icons-png.flaticon.com/128/5968/5968804.png" style="width: 28px; height: 28px; vertical-align: middle;" alt="Telegram">
                </div>
                <div style="font-size: 14px; color: rgba(255,255,255,0.5); text-align: right;">Реклама</div>
            </div>
        `;
    }

    function tryAddAdBlock() {
        if (!settings.enabled) return;
        if (document.querySelector('.itd-ad-block')) return;
        if (adBlockLastClosedTime !== 0 && Date.now() - adBlockLastClosedTime < CONFIG.AD_BLOCK_INTERVAL) return;

        const colors = getCurrentColorScheme();
        const adBlock = document.createElement('div');
        adBlock.className = 'itd-ad-block';
        adBlock.innerHTML = generateAdBlockHTML(colors);

        const closeBtn = adBlock.querySelector('.itd-ad-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                adBlock.remove();
                adBlockLastClosedTime = Date.now();
                if (adBlockTimerId) clearTimeout(adBlockTimerId);
                adBlockTimerId = setTimeout(() => {
                    tryAddAdBlock();
                }, CONFIG.AD_BLOCK_INTERVAL);
            });
        }

        document.body.appendChild(adBlock);
    }

    function refreshAdBlock() {
        const oldBlock = document.querySelector('.itd-ad-block');
        if (oldBlock) oldBlock.remove();
        tryAddAdBlock();
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

    function addPlayerToggleButton() {
        if (isPlayerToggleButtonAdded) return;
        const sidebarNav = document.querySelector('.sidebar-nav');
        if (!sidebarNav) {
            setTimeout(addPlayerToggleButton, 1000);
            return;
        }
        if (sidebarNav.querySelector('.sidebar-nav-item.itd-player-toggle')) {
            isPlayerToggleButtonAdded = true;
            return;
        }
        const btn = document.createElement('a');
        btn.className = 'sidebar-nav-item itd-player-toggle';
        btn.href = 'javascript:void(0)';
        btn.title = 'Показать плеер';
        btn.style.cssText = 'display:flex;align-items:center;justify-content:center;';
        btn.innerHTML = '<div class="icon"><span class="material-icons" style="font-size:32px; color:var(--itd-primary);">library_music</span></div>';
        btn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            if (!settings.playerVisible) {
                settings.playerVisible = true;
                saveSettings();
                if (miniPlayer) miniPlayer.style.display = 'flex';
                else createMiniPlayer();
            }
        });
        sidebarNav.appendChild(btn);
        isPlayerToggleButtonAdded = true;
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
        modal.innerHTML = `<div class="modal-content"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:1px solid ${colors.secondary};padding-bottom:15px;"><h2 style="margin:0;color:${colors.primary};font-size:22px;text-shadow:0 0 10px rgba(${colors.primaryRgb},0.3);display:flex;align-items:center;">${gearIcon} Настройки ИТД+ </h2><button id="itd-modal-close" style="background:rgba(${colors.primaryRgb},0.1);border:1px solid ${colors.primary};color:${colors.primary};cursor:pointer;font-size:24px;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;">✕</button></div><div class="setting-item"><div style="display:flex;align-items:center;justify-content:space-between;width:100%;"><div style="display:flex;align-items:center;gap:10px;"><span style="font-weight:600;font-size:16px;color:${colors.primary};">Включить стили</span><button id="itd-arrow-enabled" style="background:none;border:none;color:${colors.primary};cursor:pointer;font-size:16px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;">${expandedDescriptions.enabled ? '▲' : '▼'}</button></div><label class="toggle-switch"><input type="checkbox" id="itd-enabled" ${settings.enabled ? 'checked' : ''}><span class="toggle-slider"></span></label></div><div id="itd-desc-enabled" class="setting-description" style="max-height:${expandedDescriptions.enabled ? '100px' : '0'};opacity:${expandedDescriptions.enabled ? '1' : '0'};"><div style="margin-top:10px;padding:12px;background:rgba(${colors.secondaryRgb},0.1);border-radius:8px;border-left:3px solid ${colors.primary};font-size:13px;line-height:1.4;">Если цвета не поменялись, нажмите F5 (Fn+5) для перезагрузки страницы.</div></div></div><div class="setting-item"><div style="display:flex;align-items:center;justify-content:space-between;width:100%;"><div style="display:flex;align-items:center;gap:10px;"><span style="font-weight:600;font-size:16px;color:${colors.primary};">Apple Emoji</span><button id="itd-arrow-emoji" style="background:none;border:none;color:${colors.primary};cursor:pointer;font-size:16px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;">${expandedDescriptions.emoji ? '▲' : '▼'}</button></div><label class="toggle-switch"><input type="checkbox" id="itd-emoji" ${settings.emojiEnabled ? 'checked' : ''}><span class="toggle-slider"></span></label></div><div id="itd-desc-emoji" class="setting-description" style="max-height:${expandedDescriptions.emoji ? '100px' : '0'};opacity:${expandedDescriptions.emoji ? '1' : '0'};"><div style="margin-top:10px;padding:12px;background:rgba(${colors.secondaryRgb},0.1);border-radius:8px;border-left:3px solid ${colors.primary};font-size:13px;line-height:1.4;">Используются официальные эмодзи Apple. Могут быть некорректные отображения.</div></div></div><div class="setting-item"><div style="width:100%;"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:${expandedDescriptions.colors ? '10px' : '0'};"><div style="display:flex;align-items:center;gap:10px;"><span style="font-weight:600;font-size:16px;color:${colors.primary};">Цветовая схема</span><button id="itd-arrow-colors" style="background:none;border:none;color:${colors.primary};cursor:pointer;font-size:16px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;">${expandedDescriptions.colors ? '▲' : '▼'}</button></div></div><div id="itd-desc-colors" class="setting-description" style="max-height:${expandedDescriptions.colors ? '100px' : '0'};opacity:${expandedDescriptions.colors ? '1' : '0'};margin-bottom:10px;"><div style="padding:12px;background:rgba(${colors.secondaryRgb},0.1);border-radius:8px;border-left:3px solid ${colors.primary};font-size:13px;line-height:1.4;">Баг-репорты: @yetilov_robot</div></div><select id="itd-color-scheme" style="background:rgba(34,25,36,0.8);color:white;border:1px solid ${colors.secondary};border-radius:12px;padding:10px 14px;width:100%;font-size:14px;backdrop-filter:blur(10px);">${Object.keys(colorSchemes).map(s => `<option value="${s}" ${settings.colorScheme === s ? 'selected' : ''}>${colorSchemes[s].name}</option>`).join('')}<option value="custom" ${settings.colorScheme === 'custom' ? 'selected' : ''}>Пользовательский цвет</option></select></div></div><div id="itd-custom-color-container" style="display:${settings.colorScheme === 'custom' ? 'block' : 'none'};margin-top:15px;padding:15px;background:rgba(34,25,36,0.5);border-radius:12px;border:1px solid ${colors.secondary};backdrop-filter:blur(10px);"><div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"><span style="font-weight:500;font-size:14px;color:${colors.primary};">Свой цвет:</span><input type="color" id="itd-custom-color-picker" value="${settings.customColor || '#bc50d4'}" style="width:40px;height:40px;border-radius:8px;border:2px solid ${colors.secondary};cursor:pointer;"><input type="text" id="itd-custom-color-input" value="${settings.customColor || '#bc50d4'}" style="flex:1;background:rgba(255,255,255,0.05);color:white;border:1px solid ${colors.secondary};border-radius:8px;padding:8px 12px;font-family:'Consolas',monospace;font-size:13px;backdrop-filter:blur(5px);"></div><div style="font-size:12px;color:rgba(255,255,255,0.6);">HEX-код (например, #ff0000)</div></div><div style="margin-top:20px;padding:15px;background:rgba(34,25,36,0.5);border-radius:15px;border:1px solid ${colors.secondary};backdrop-filter:blur(10px);"><div style="font-weight:600;color:${colors.primary};margin-bottom:12px;font-size:15px;text-shadow:0 0 5px rgba(${colors.primaryRgb},0.2);">🎨 Предпросмотр</div><div style="display:flex;gap:15px;flex-wrap:wrap;"><div style="display:flex;align-items:center;"><div style="background:${colors.primary};width:24px;height:24px;border-radius:6px;margin-right:10px;box-shadow:0 0 8px ${colors.primary};"></div><span style="font-size:14px;color:rgba(255,255,255,0.9);">Основной</span></div><div style="display:flex;align-items:center;"><div style="background:${colors.secondary};width:24px;height:24px;border-radius:6px;margin-right:10px;box-shadow:0 0 8px ${colors.secondary};"></div><span style="font-size:14px;color:rgba(255,255,255,0.9);">Вторичный</span></div><div style="display:flex;align-items:center;"><div style="background:${colors.accent};width:24px;height:24px;border-radius:6px;margin-right:10px;box-shadow:0 0 8px ${colors.accent};"></div><span style="font-size:14px;color:rgba(255,255,255,0.9);">Акцент</span></div></div></div><div style="margin-top:15px;padding:15px;background:rgba(34,25,36,0.5);border-radius:15px;border:1px solid ${colors.secondary};backdrop-filter:blur(10px);"><div style="display:flex;flex-direction:column;gap:8px;"><div style="font-weight:700;font-size:18px;color:${colors.primary};">ИТД+ v2.5.1</div><div style="font-size:14px;color:rgba(255,255,255,0.8);">Мини-плеер со списком треков, эмодзи</div><div style="margin-top:8px;font-size:13px;color:rgba(255,255,255,0.6);font-style:italic;">⚡ Кнопка списка треков в плеере</div><div style="margin-top:12px;font-size:13px;color:rgba(255,255,255,0.6);">2020-2026 <a href="https://t.me/vcb_code" target="_blank" style="color:${colors.primary};text-decoration:none;border-bottom:1px solid ${colors.primary};">VCB</a></div></div></div><div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px;"><button id="itd-reset-colors" style="background:transparent;color:${colors.primary};border:1px solid ${colors.primary};padding:12px 22px;border-radius:25px;font-weight:600;cursor:pointer;font-size:14px;">Сброс</button><button id="itd-save-settings" style="background:linear-gradient(135deg,${colors.primary},${colors.accent});color:white;border:none;padding:12px 28px;border-radius:25px;font-weight:600;cursor:pointer;font-size:14px;box-shadow:0 4px 15px rgba(${colors.primaryRgb},0.3);">Сохранить</button></div></div>`;
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

        modal.addEventListener('click', e => {
            if (e.target === modal) {
                modal.remove();
                currentModal = null;
            }
        });
    }

    function createMiniPlayer() {
        if (miniPlayer) return;
        const colors = getCurrentColorScheme();
        miniPlayer = document.createElement('div');
        miniPlayer.id = 'itd-mini-player';
        miniPlayer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 600px;
            max-width: 90vw;
            background: rgba(14,13,14,0.95);
            border: 1px solid ${colors.secondary};
            border-radius: 40px;
            padding: 16px 24px;
            color: white;
            font-family: Inter, sans-serif;
            backdrop-filter: blur(20px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            z-index: 9998;
            display: ${settings.playerVisible ? 'flex' : 'none'};
            flex-direction: column;
            gap: 10px;
            transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
        `;
        miniPlayer.innerHTML = `
            <div id="itd-mini-main-row" style="display: flex; align-items: center; gap: 16px;">
                <img id="itd-mini-cover"
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 24 24' fill='%23333'%3E%3Cpath d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z'/%3E%3C/svg%3E"
                    style="width:56px; height:56px; border-radius:12px; object-fit:cover; flex-shrink:0; transition: all 0.3s ease;">
                <div style="flex:1; min-width:0;">
                    <div id="itd-mini-title" style="font-weight:600; font-size:1.1rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Без названия</div>
                    <div id="itd-mini-artist" style="font-size:0.9rem; color:#bdbdbd; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Неизвестный исполнитель</div>
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <label style="background:none; border:none; color:${colors.primary}; cursor:pointer; padding:4px;" title="Загрузить треки">
                        <span class="material-icons" style="font-size:22px;">upload</span>
                        <input type="file" id="itd-mini-fileInput" multiple accept="audio/*" style="display: none;">
                    </label>
                    <button id="itd-mini-show-list" style="background:none; border:none; color:${colors.primary}; cursor:pointer; padding:4px;" title="Показать список треков">
                        <span class="material-icons" style="font-size:22px;">queue_music</span>
                    </button>
                    <button id="itd-mini-shuffle" style="background:none; border:none; color:${shuffle ? colors.primary : '#bdbdbd'}; cursor:pointer; padding:4px;" title="Перемешать">
                        <span class="material-icons" style="font-size:22px;">shuffle</span>
                    </button>
                    <button id="itd-mini-prev" style="background:none; border:none; color:white; cursor:pointer; padding:4px;">
                        <span class="material-icons" style="font-size:22px;">skip_previous</span>
                    </button>
                    <button id="itd-mini-playpause" style="background:#ffffff1a; border:1px solid rgba(255,255,255,0.1); color:#fff; width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0;">
                        <span id="itd-mini-icon" class="material-icons">play_arrow</span>
                    </button>
                    <button id="itd-mini-next" style="background:none; border:none; color:white; cursor:pointer; padding:4px;">
                        <span class="material-icons" style="font-size:22px;">skip_next</span>
                    </button>
                    <button id="itd-mini-collapse" style="background:none; border:none; color:#bdbdbd; cursor:pointer; padding:4px; transition: transform 0.3s ease;" title="Свернуть">
                        <span class="material-icons" style="font-size:20px;">expand_more</span>
                    </button>
                    <button id="itd-mini-close" style="background:none; border:none; color:#ff5555; cursor:pointer; padding:4px;" title="Закрыть плеер">
                        <span class="material-icons" style="font-size:20px;">close</span>
                    </button>
                </div>
            </div>
            <div id="itd-mini-bottom-row" style="display:flex; align-items:center; gap:12px; overflow:hidden; transition: all 0.3s ease; max-height: 40px; opacity: 1;">
                <span id="itd-mini-current" style="font-size:0.85rem; color:#bdbdbd; min-width:36px;">0:00</span>
                <input type="range" id="itd-mini-progress" min="0" max="100" value="0" step="0.1"
                    style="flex:1; height:5px; -webkit-appearance:none; background:rgba(255,255,255,0.2); border-radius:5px; cursor:pointer;">
                <span id="itd-mini-duration" style="font-size:0.85rem; color:#bdbdbd; min-width:36px;">0:00</span>
                <button id="itd-mini-mute" style="background:none; border:none; color:#bdbdbd; cursor:pointer; padding:4px;">
                    <span id="itd-mini-muteicon" class="material-icons" style="font-size:20px;">volume_up</span>
                </button>
                <input type="range" id="itd-mini-volume" min="0" max="1" step="0.01" value="0.8"
                    style="width:70px; height:5px; -webkit-appearance:none; background:rgba(255,255,255,0.2); border-radius:5px; cursor:pointer;">
            </div>
        `;
        document.body.appendChild(miniPlayer);

        const miniShuffle   = miniPlayer.querySelector('#itd-mini-shuffle');
        const miniPrev      = miniPlayer.querySelector('#itd-mini-prev');
        const miniPlayPause = miniPlayer.querySelector('#itd-mini-playpause');
        const miniNext      = miniPlayer.querySelector('#itd-mini-next');
        const miniProgress  = miniPlayer.querySelector('#itd-mini-progress');
        const miniVolume    = miniPlayer.querySelector('#itd-mini-volume');
        const miniMute      = miniPlayer.querySelector('#itd-mini-mute');
        const miniIcon      = miniPlayer.querySelector('#itd-mini-icon');
        const miniMuteIcon  = miniPlayer.querySelector('#itd-mini-muteicon');
        const miniCurrent   = miniPlayer.querySelector('#itd-mini-current');
        const miniDuration  = miniPlayer.querySelector('#itd-mini-duration');
        const miniCover     = miniPlayer.querySelector('#itd-mini-cover');
        const miniTitle     = miniPlayer.querySelector('#itd-mini-title');
        const miniArtist    = miniPlayer.querySelector('#itd-mini-artist');
        const miniCollapse  = miniPlayer.querySelector('#itd-mini-collapse');
        const miniBottomRow = miniPlayer.querySelector('#itd-mini-bottom-row');
        const miniClose     = miniPlayer.querySelector('#itd-mini-close');
        const fileInput     = miniPlayer.querySelector('#itd-mini-fileInput');
        const miniShowList  = miniPlayer.querySelector('#itd-mini-show-list');

        miniCollapse.addEventListener('click', () => {
            isPlayerMinimized = !isPlayerMinimized;
            if (isPlayerMinimized) {
                miniBottomRow.style.maxHeight = '0';
                miniBottomRow.style.opacity   = '0';
                miniBottomRow.style.marginTop = '-10px';
                miniCover.style.width  = '36px';
                miniCover.style.height = '36px';
                miniPlayer.style.padding = '10px 20px';
                miniCollapse.querySelector('.material-icons').textContent = 'expand_less';
                miniCollapse.title = 'Развернуть';
            } else {
                miniBottomRow.style.maxHeight = '40px';
                miniBottomRow.style.opacity   = '1';
                miniBottomRow.style.marginTop = '0';
                miniCover.style.width  = '56px';
                miniCover.style.height = '56px';
                miniPlayer.style.padding = '16px 24px';
                miniCollapse.querySelector('.material-icons').textContent = 'expand_more';
                miniCollapse.title = 'Свернуть';
            }
        });

        miniShuffle.addEventListener('click', () => {
            shuffle = !shuffle;
            settings.shuffle = shuffle;
            saveSettings();
            miniShuffle.style.color = shuffle ? getCurrentColorScheme().primary : '#bdbdbd';
        });

        miniPlayPause.addEventListener('click', () => {
            if (tracks.length === 0 || currentTrackIndex === -1) return;
            if (audioElement.paused) {
                audioElement.play().catch(() => {});
            } else {
                audioElement.pause();
            }
        });

        miniPrev.addEventListener('click', () => {
            if (tracks.length === 0) return;
            let newIndex;
            if (shuffle) {
                do {
                    newIndex = Math.floor(Math.random() * tracks.length);
                } while (tracks.length > 1 && newIndex === currentTrackIndex);
            } else {
                newIndex = currentTrackIndex - 1;
                if (newIndex < 0) newIndex = tracks.length - 1;
            }
            loadTrack(newIndex);
        });

        miniNext.addEventListener('click', () => {
            if (tracks.length === 0) return;
            let newIndex;
            if (shuffle) {
                do {
                    newIndex = Math.floor(Math.random() * tracks.length);
                } while (tracks.length > 1 && newIndex === currentTrackIndex);
            } else {
                newIndex = currentTrackIndex + 1;
                if (newIndex >= tracks.length) newIndex = 0;
            }
            loadTrack(newIndex);
        });

        miniProgress.addEventListener('input', () => {
            if (audioElement.duration) {
                audioElement.currentTime = (miniProgress.value / 100) * audioElement.duration;
            }
        });

        miniVolume.addEventListener('input', () => {
            audioElement.volume = miniVolume.value;
            updateMuteIcon();
        });

        miniMute.addEventListener('click', () => {
            audioElement.muted = !audioElement.muted;
            updateMuteIcon();
        });

        miniClose.addEventListener('click', () => {
            settings.playerVisible = false;
            saveSettings();
            miniPlayer.style.display = 'none';
        });

        fileInput.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            for (const file of files) {
                await processFile(file);
            }
            if (trackListPopup) renderTrackList();
            showNotification(`Загружено ${files.length} трек${files.length === 1 ? '' : 'ов'}`);
            if (tracks.length > 0 && currentTrackIndex === -1) {
                loadTrack(0);
            }
        });

        miniShowList.addEventListener('click', () => {
            if (trackListPopup) {
                closeTrackListPopup();
            } else {
                openTrackListPopup();
            }
        });

        audioElement.addEventListener('timeupdate', () => {
            if (audioElement.duration) {
                const percent = (audioElement.currentTime / audioElement.duration) * 100;
                miniProgress.value = percent;
                miniCurrent.textContent = formatTime(audioElement.currentTime);
            }
        });

        audioElement.addEventListener('loadedmetadata', () => {
            miniDuration.textContent = formatTime(audioElement.duration);
            if (currentTrackIndex >= 0 && tracks[currentTrackIndex]) {
                tracks[currentTrackIndex].duration = audioElement.duration;
            }
        });

        audioElement.addEventListener('play', () => {
            miniIcon.textContent = 'pause';
        });

        audioElement.addEventListener('pause', () => {
            miniIcon.textContent = 'play_arrow';
        });

        audioElement.addEventListener('ended', () => {
            if (tracks.length > 0) {
                let newIndex;
                if (shuffle) {
                    do {
                        newIndex = Math.floor(Math.random() * tracks.length);
                    } while (tracks.length > 1 && newIndex === currentTrackIndex);
                } else {
                    newIndex = currentTrackIndex + 1;
                    if (newIndex >= tracks.length) newIndex = 0;
                }
                loadTrack(newIndex);
            }
        });

        updateMuteIcon();
        updateMiniPlayerUI();
    }

    function updateMuteIcon() {
        const miniMuteIcon = miniPlayer?.querySelector('#itd-mini-muteicon');
        if (miniMuteIcon) {
            miniMuteIcon.textContent = (audioElement.muted || audioElement.volume === 0) ? 'volume_off' : 'volume_up';
        }
    }

    function updateMiniPlayerUI() {
        if (!miniPlayer || currentTrackIndex < 0 || !tracks[currentTrackIndex]) return;
        const track = tracks[currentTrackIndex];
        const miniTitle = miniPlayer.querySelector('#itd-mini-title');
        const miniArtist = miniPlayer.querySelector('#itd-mini-artist');
        const miniCover = miniPlayer.querySelector('#itd-mini-cover');
        if (miniTitle) miniTitle.textContent = track.title || 'Без названия';
        if (miniArtist) miniArtist.textContent = track.artist || 'Неизвестный исполнитель';
        if (miniCover) miniCover.src = track.coverUrl || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'56\' height=\'56\' viewBox=\'0 0 24 24\' fill=\'%23333\'%3E%3Cpath d=\'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z\'/%3E%3C/svg%3E';
    }

    function openTrackListPopup() {
        if (trackListPopup) {
            trackListPopup.style.display = 'block';
            return;
        }
        const colors = getCurrentColorScheme();
        trackListPopup = document.createElement('div');
        trackListPopup.id = 'itd-track-list-popup';
        trackListPopup.style.cssText = `
            position: fixed;
            bottom: 140px;
            left: 50%;
            transform: translateX(-50%);
            width: 580px;
            max-width: 90vw;
            max-height: 400px;
            overflow-y: auto;
            background: rgba(14,13,14,0.98);
            border: 1px solid ${colors.secondary};
            border-radius: 24px;
            padding: 20px;
            color: white;
            font-family: Inter, sans-serif;
            backdrop-filter: blur(20px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            z-index: 10001;
            display: block;
        `;
        trackListPopup.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid ${colors.secondary};">
                <span style="font-weight:600; font-size:1.1rem;">Все треки</span>
                <button id="itd-close-track-list" style="background:none; border:none; color:${colors.primary}; cursor:pointer;"><span class="material-icons">close</span></button>
            </div>
            <div id="itd-track-list-container" style="display:flex; flex-direction:column; gap:6px;"></div>
        `;
        document.body.appendChild(trackListPopup);

        trackListPopup.querySelector('#itd-close-track-list').addEventListener('click', closeTrackListPopup);
        renderTrackList();
    }

    function closeTrackListPopup() {
        if (trackListPopup) {
            trackListPopup.remove();
            trackListPopup = null;
        }
    }

    function renderTrackList() {
        const container = document.getElementById('itd-track-list-container');
        if (!container) return;
        container.innerHTML = '';
        tracks.forEach((track, index) => {
            const item = document.createElement('div');
            item.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px;
                border-radius: 8px;
                background: ${index === currentTrackIndex ? '#d0bcff1a' : '#ffffff03'};
                border: 1px solid ${index === currentTrackIndex ? '#d0bcff33' : 'rgba(255,255,255,0.03)'};
                cursor: pointer;
                transition: background 0.1s;
            `;
            item.addEventListener('mouseenter', () => {
                item.style.background = '#ffffff0f';
            });
            item.addEventListener('mouseleave', () => {
                item.style.background = index === currentTrackIndex ? '#d0bcff1a' : '#ffffff03';
            });

            const cover = track.coverUrl || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 24 24\' fill=\'%23333\'%3E%3Cpath d=\'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z\'/%3E%3C/svg%3E';
            const itemContent = document.createElement('div');
            itemContent.style.cssText = 'display:flex; align-items:center; gap:10px; flex:1; min-width:0;';
            itemContent.innerHTML = `
                <img src="${cover}" style="width:32px; height:32px; border-radius:6px; object-fit:cover;">
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:600; font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(track.title)}</div>
                    <div style="font-size:0.75rem; color:#bdbdbd; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(track.artist)}</div>
                </div>
                <div style="font-size:0.75rem; color:#bdbdbd;">${formatTime(track.duration)}</div>
            `;

            const deleteBtn = document.createElement('button');
            deleteBtn.style.cssText = 'background:none; border:none; color:#ff5555; cursor:pointer; padding:4px; margin-left:auto;';
            deleteBtn.innerHTML = '<span class="material-icons" style="font-size:18px;">delete</span>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTrack(index);
            });

            item.appendChild(itemContent);
            item.appendChild(deleteBtn);
            item.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                loadTrack(index);
                closeTrackListPopup();
            });

            container.appendChild(item);
        });
    }

    async function deleteTrack(index) {
        if (index < 0 || index >= tracks.length) return;
        const track = tracks[index];
        if (track.id) {
            await deleteTrackFromDB(track.id);
        }
        if (track.audioUrl) URL.revokeObjectURL(track.audioUrl);
        if (track.coverUrl) URL.revokeObjectURL(track.coverUrl);
        tracks.splice(index, 1);
        if (index === currentTrackIndex) {
            if (tracks.length > 0) {
                let newIndex = index;
                if (newIndex >= tracks.length) newIndex = tracks.length - 1;
                loadTrack(newIndex);
            } else {
                audioElement.pause();
                audioElement.src = '';
                currentTrackIndex = -1;
                updateMiniPlayerUI();
            }
        } else if (index < currentTrackIndex) {
            currentTrackIndex--;
        }
        if (trackListPopup) renderTrackList();
        showNotification('Трек удален');
    }

    function initPlayerDatabase() {
        const DB_NAME = 'localPlayerDB';
        const STORE_NAME = 'tracks';
        const request = indexedDB.open(DB_NAME, 1);
        request.onerror = () => console.error('IndexedDB error');
        request.onsuccess = (e) => {
            db = e.target.result;
            loadTracksFromDB().then(() => {
                if (tracks.length > 0 && currentTrackIndex === -1) {
                    if (settings.lastTrackId) {
                        const idx = tracks.findIndex(t => t.id === settings.lastTrackId);
                        if (idx !== -1) loadTrack(idx);
                        else loadTrack(0);
                    } else {
                        loadTrack(0);
                    }
                }
                if (miniPlayer) updateMiniPlayerUI();
            });
        };
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    }

    async function loadTracksFromDB() {
        return new Promise((resolve, reject) => {
            if (!db) return resolve();
            const tx = db.transaction('tracks', 'readonly');
            const store = tx.objectStore('tracks');
            const request = store.getAll();
            request.onsuccess = () => {
                const storedTracks = request.result || [];
                storedTracks.forEach(t => {
                    if (t.audioBase64) {
                        const audioBlob = base64ToBlob(t.audioBase64, 'audio/mpeg');
                        t.audioUrl = URL.createObjectURL(audioBlob);
                    }
                    if (t.coverBase64) {
                        const coverBlob = base64ToBlob(t.coverBase64, 'image/jpeg');
                        t.coverUrl = URL.createObjectURL(coverBlob);
                    } else {
                        t.coverUrl = null;
                    }
                });
                tracks = storedTracks;
                resolve();
            };
            request.onerror = reject;
        });
    }

    async function saveTrackToDB(track) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('tracks', 'readwrite');
            const store = tx.objectStore('tracks');
            const trackForStore = { ...track };
            delete trackForStore.audioUrl;
            delete trackForStore.coverUrl;
            const request = store.add(trackForStore);
            request.onsuccess = (e) => {
                track.id = e.target.result;
                resolve(track.id);
            };
            request.onerror = reject;
        });
    }

    async function deleteTrackFromDB(trackId) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('tracks', 'readwrite');
            const store = tx.objectStore('tracks');
            const request = store.delete(trackId);
            request.onsuccess = () => resolve();
            request.onerror = reject;
        });
    }

    function base64ToBlob(base64, mimeType) {
        const byteChars = atob(base64.split(',')[1] || base64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
            byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async function processFile(file) {
        try {
            const tags = await readTags(file);
            const title = tags?.title || file.name.replace(/\.[^/.]+$/, '');
            const artist = tags?.artist || 'Неизвестный исполнитель';
            let coverBase64 = null;
            if (tags?.picture) {
                const picture = tags.picture;
                const base64String = `data:${picture.format};base64,${arrayBufferToBase64(picture.data)}`;
                coverBase64 = base64String;
            }

            const audioBase64 = await blobToBase64(file);
            const track = {
                fileName: file.name,
                title,
                artist,
                coverBase64,
                audioBase64,
                duration: 0
            };

            const audioUrl = URL.createObjectURL(file);
            const tempAudio = new Audio(audioUrl);
            await new Promise((resolve) => {
                tempAudio.addEventListener('loadedmetadata', () => {
                    track.duration = tempAudio.duration;
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                });
                tempAudio.addEventListener('error', () => {
                    track.duration = 0;
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                });
                tempAudio.load();
            });

            track.audioUrl = URL.createObjectURL(file);
            if (coverBase64) {
                const coverBlob = base64ToBlob(coverBase64, 'image/jpeg');
                track.coverUrl = URL.createObjectURL(coverBlob);
            }

            const id = await saveTrackToDB(track);
            track.id = id;
            tracks.push(track);
        } catch (error) {
            console.error('Ошибка при обработке файла:', error);
            const audioUrl = URL.createObjectURL(file);
            const tempAudio = new Audio(audioUrl);
            const duration = await new Promise((res) => {
                tempAudio.addEventListener('loadedmetadata', () => res(tempAudio.duration));
                tempAudio.addEventListener('error', () => res(0));
            });
            const track = {
                fileName: file.name,
                title: file.name.replace(/\.[^/.]+$/, ''),
                artist: 'Неизвестный исполнитель',
                audioBase64: await blobToBase64(file),
                duration,
                audioUrl
            };
            const id = await saveTrackToDB(track);
            track.id = id;
            tracks.push(track);
        }
    }

    function readTags(file) {
        return new Promise((resolve, reject) => {
            window.jsmediatags.read(file, {
                onSuccess: (tag) => {
                    const tags = tag.tags;
                    resolve({
                        title: tags.title,
                        artist: tags.artist,
                        picture: tags.picture
                    });
                },
                onError: (error) => {
                    console.warn('Не удалось прочитать теги:', error);
                    resolve(null);
                }
            });
        });
    }

    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function loadTrack(index) {
        if (index < 0 || index >= tracks.length) return;
        currentTrackIndex = index;
        const track = tracks[index];

        audioElement.src = track.audioUrl;
        audioElement.load();
        audioElement.volume = parseFloat(miniPlayer?.querySelector('#itd-mini-volume')?.value || 0.8);

        settings.lastTrackId = track.id;
        saveSettings();

        updateMiniPlayerUI();
        if (trackListPopup) renderTrackList();

        if (settings.playerVisible) {
            audioElement.play().catch(() => {});
        }
    }

    function escapeHtml(unsafe) {
        return unsafe.replace(/[&<>"']/g, function(m) {
            if(m === '&') return '&amp;'; if(m === '<') return '&lt;'; if(m === '>') return '&gt;';
            if(m === '"') return '&quot;'; return '&#039;';
        });
    }

    function initEmojiSystem() {
        if (!settings.emojiEnabled) return removeEmojiSystem();
        removeEmojiSystem();
        const emojiStyle = document.createElement('style');
        emojiStyle.id = 'apple-emoji-styles';
        emojiStyle.textContent = `.apple-emoji{font-size:inherit!important;line-height:inherit!important;vertical-align:text-bottom!important;display:inline-block!important;}.apple-emoji-container{display:inline-block;line-height:inherit;}.apple-emoji{position:relative;top:0.1em;}`;
        document.head.appendChild(emojiStyle);
        const emojiConfig = {
            emojiSource: 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64',
            imageFormat: 'png',
            excludeSelectors: ['script','style','textarea','input','code','pre','.no-emoji','[data-no-emoji]','[contenteditable="true"]']
        };
        const emojiCache = new Map();
        function normalizeEmojiCode(code) { return code.replace(/-fe0f/g,'').replace(/fe0f-?/g,'').replace(/-+/g,'-').replace(/^-|-$/g,''); }
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
                    if (charCode) { fullCode += (fullCode ? '-' : '') + charCode; if (codePoint > 0xFFFF) i++; }
                }
                return normalizeEmojiCode(fullCode);
            } catch { return null; }
        }
        function shouldProcessEmojiElement(element) {
            if (!element || !element.textContent) return false;
            for (const sel of emojiConfig.excludeSelectors) { if (element.closest(sel)) return false; }
            const emojiRegex = /[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}]/gu;
            return emojiRegex.test(element.textContent);
        }
        function createEmojiElement(emojiChar) {
            const emojiCode = getEmojiCode(emojiChar);
            if (!emojiCode) return document.createTextNode(emojiChar);
            if (emojiCache.has(emojiChar)) return emojiCache.get(emojiChar).cloneNode(true);
            const container = document.createElement('span');
            container.className = 'apple-emoji-container';
            container.setAttribute('data-emoji', emojiChar);
            const img = document.createElement('img');
            img.src = `${emojiConfig.emojiSource}/${emojiCode}.${emojiConfig.imageFormat}`;
            img.alt = emojiChar; img.className = 'apple-emoji'; img.loading = 'lazy';
            img.style.cssText = 'display:inline-block;vertical-align:text-bottom;height:1.2em;width:auto;max-width:1.2em;min-width:1em;object-fit:contain;margin:0 0.05em;';
            img.onerror = () => { img.replaceWith(document.createTextNode(emojiChar)); };
            container.appendChild(img);
            emojiCache.set(emojiChar, container.cloneNode(true));
            return container;
        }
        function processEmojiTextNode(textNode) {
            if (!textNode || !textNode.textContent || !shouldProcessEmojiElement(textNode.parentElement)) return false;
            const text = textNode.textContent;
            const emojiRegex = /([\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}])(?:\u200D[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}])*|[\p{Emoji}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji_Modifier_Base}\p{Emoji_Presentation}]/gu;
            const matches = [...text.matchAll(emojiRegex)];
            if (!matches.length) return false;
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            for (const match of matches) {
                if (match.index > lastIndex) fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                fragment.appendChild(createEmojiElement(match[0]));
                lastIndex = match.index + match[0].length;
            }
            if (lastIndex < text.length) fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            try { textNode.parentNode.replaceChild(fragment, textNode); return true; } catch { return false; }
        }
        processEmojiDOM = function(rootElement = document.body) {
            if (!rootElement) return;
            const walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT, {
                acceptNode: node => shouldProcessEmojiElement(node.parentElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
            });
            const nodes = [];
            let node;
            while (node = walker.nextNode()) nodes.push(node);
            for (let i = nodes.length - 1; i >= 0; i--) processEmojiTextNode(nodes[i]);
        };
        let timeoutId = null;
        if (emojiObserver) emojiObserver.disconnect();
        emojiObserver = new MutationObserver(() => { clearTimeout(timeoutId); timeoutId = setTimeout(() => processEmojiDOM(), 100); });
        emojiObserver.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => processEmojiDOM(), 500);
    }

    function removeEmojiSystem() {
        document.getElementById('apple-emoji-styles')?.remove();
        if (emojiObserver) { emojiObserver.disconnect(); emojiObserver = null; }
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
        notification.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);background:${isError ? 'rgba(220,53,69,0.9)' : `rgba(${colors.primaryRgb},0.9)`};color:white;padding:12px 24px;border-radius:40px;font-family:Inter,sans-serif;font-weight:500;z-index:1000000;box-shadow:0 10px 25px rgba(0,0,0,0.3);border:1px solid ${colors.secondary};backdrop-filter:blur(10px);text-align:center;white-space:nowrap;max-width:90%;font-size:14px;display:flex;align-items:center;gap:8px;`;
        const icon = document.createElement('span');
        icon.innerHTML = isError ? '❌' : '✅';
        notification.prepend(icon);
        notification.appendChild(document.createTextNode(text));
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.15s';
            setTimeout(() => notification.remove(), 150);
        }, CONFIG.NOTIFICATION_DURATION);
    }

    function startPeriodicCheck() {
        setInterval(() => {
            if (!isSettingsButtonAdded) addSettingsButton();
            if (!isPlayerToggleButtonAdded) addPlayerToggleButton();
            tryAddAdBlock();
        }, CONFIG.CHECK_INTERVAL);
    }

    function init() {
        applyAllStyles();
        setTimeout(addSettingsButton, 800);
        setTimeout(addPlayerToggleButton, 800);
        startPeriodicCheck();
        tryAddAdBlock();
        initPlayerDatabase();
        createMiniPlayer();
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
