
const DEFAULT_LANG = 'en'
const SUPPORTED_LANG = {
    'en': {
        err: 'Error',
        pepw: 'Please enter password.',
        pwcnbe: 'Password is empty!',
        enpw: 'Enter a new password(Keeping it empty will remove the current password)',
        pwss: 'Password set successfully.',
        pwrs: 'Password removed successfully.',
        cpys: 'Copied!',
    },
    'zh': {
        err: '出错了',
        pepw: '请输入密码',
        pwcnbe: '密码不能为空！',
        enpw: '输入新密码（留空可清除当前密码）',
        pwss: '密码设置成功！',
        pwrs: '密码清除成功！',
        cpys: '已复制',
    }
}

const getI18n = key => {
    const userLang = (navigator.language || navigator.userLanguage || DEFAULT_LANG).split('-')[0]
    const targetLang = Object.keys(SUPPORTED_LANG).find(l => l === userLang) || DEFAULT_LANG
    return SUPPORTED_LANG[targetLang][key]
}

const errHandle = (err) => {
    alert(`${getI18n('err')}: ${err}`)
}

const throttle = (func, delay) => {
    let tid = null

    return (...arg) => {
        if (tid) return;

        tid = setTimeout(() => {
            func(...arg)
            tid = null
        }, delay)
    }
}

const passwdPrompt = () => {
    const passwd = window.prompt(getI18n('pepw'))
    if (passwd == null) return;

    if (!passwd.trim()) {
        alert(getI18n('pwcnbe'))
    }
    const path = location.pathname
    window.fetch(`${path}/auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            passwd,
        }),
    })
        .then(res => res.json())
        .then(res => {
            if (res.err !== 0) {
                return errHandle(res.msg)
            }
            if (res.data.refresh) {
                window.location.reload()
            }
        })
        .catch(err => errHandle(err))
}

const renderPlain = (node, text) => {
    if (node) {
        node.innerHTML = DOMPurify.sanitize(text)
    }
}

const renderMarkdown = (node, text) => {
    if (node) {
        const parseText = marked.parse(text)
        node.innerHTML = DOMPurify.sanitize(parseText)
    }
}
// 创建一个通知元素
const notification = document.createElement('div');
notification.className = 'notification'; // 添加 CSS 类
document.body.appendChild(notification);
// 显示通知的函数
function showNotification(message) {
    notification.textContent = message;

    if (notification.classList.contains('show')) {
        notification.classList.remove('show'); 
        notification.style.display = 'none'; 
    }
    notification.style.display = 'block'; 
    notification.classList.add('show'); 

    setTimeout(() => {
        notification.classList.remove('show'); 
        setTimeout(() => {
            notification.style.display = 'none'; 
        }, 500); 
    }, 3000); 
}
window.addEventListener('DOMContentLoaded', function () {
    const $textarea = document.querySelector('#contents')
    const $loading = document.querySelector('#loading')
    const $pwBtn = document.querySelector('.opt-pw')
    const $saveBtn = document.querySelector('.opt-save')    //保存按钮
    const $modeBtn = document.querySelector('.opt-mode > input')
    const $shareBtn = document.querySelector('.opt-share > input')
    const $autosaveBtn = document.querySelector('.opt-autoSave > input')        //自动保存选项
    const $previewPlain = document.querySelector('#preview-plain')
    const $previewMd = document.querySelector('#preview-md')
    const $shareModal = document.querySelector('.share-modal')
    const $closeBtn = document.querySelector('.share-modal .close-btn')
    const $copyBtn = document.querySelector('.share-modal .opt-button')
    const $shareInput = document.querySelector('.share-modal input')

    renderPlain($previewPlain, $textarea.value)
    renderMarkdown($previewMd, $textarea.value)

    // 保存功能
    const saveContent = () => {
        $saveBtn.disabled = true;
        renderMarkdown($previewMd, $textarea.value);
        $loading.style.display = 'inline-block';
        const data = { t: $textarea.value };
        window.fetch('', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data),
        })
            .then(res => res.json())
            .then(res => {
                if (res.err !== 0) { errHandle(res.msg) }
            })
            .catch(err => errHandle(err))
            .finally(() => {
                $loading.style.display = 'none';
                showNotification('已保存');
                // 使用 setTimeout 在 3 秒后重新启用按钮
                setTimeout(function () {
                    $saveBtn.disabled = false;
                }, 3000);
            });
    };

    if ($textarea) {
    // 只在自动保存按钮被选中时设置 oninput 事件
        if ($autosaveBtn) { 
            const autosaveHandler = throttle(function () {
                renderMarkdown($previewMd, $textarea.value);
                if ($autosaveBtn.checked) { 
                    $loading.style.display = 'inline-block';
                    const data = { t: $textarea.value };
                    window.fetch('', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams(data),
                    })
                    .then(res => res.json())
                    .then(res => {
                        if (res.err !== 0) { errHandle(res.msg); }
                    })
                    .catch(err => errHandle(err))
                    .finally(() => { $loading.style.display = 'none'; });
                    showNotification('已自动保存');
                }
            }, 15000); 
            $textarea.oninput = autosaveHandler;
        }
        if ($saveBtn) {
            $saveBtn.onclick = saveContent;
        }
    }
    
    let lastSaveTime = 0; 
    window.addEventListener('keydown', function (event) {
       if (event.ctrlKey && event.key === 's') {
           event.preventDefault(); 
           const currentTime = Date.now(); 
           if (currentTime - lastSaveTime >= 3000) { 
               saveContent(); 
               lastSaveTime = currentTime; 
           }
       }
    });


    if ($pwBtn) {
        $pwBtn.onclick = function () {
            const passwd = window.prompt(getI18n('enpw'))
            if (passwd == null) return;

            const path = window.location.pathname
            window.fetch(`${path}/pw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    passwd: passwd.trim(),
                }),
            })
                .then(res => res.json())
                .then(res => {
                    if (res.err !== 0) {
                        return errHandle(res.msg)
                    }
                    alert(passwd ? getI18n('pwss') : getI18n('pwrs'))
                })
                .catch(err => errHandle(err))
        }
    }

    if ($modeBtn) {
        $modeBtn.onclick = function (e) {
            const isMd = e.target.checked
            const path = window.location.pathname
            window.fetch(`${path}/setting`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mode: isMd ? 'md' : 'plain',
                }),
            })
                .then(res => res.json())
                .then(res => {
                    if (res.err !== 0) {
                        return errHandle(res.msg)
                    }

                    window.location.reload()
                })
                .catch(err => errHandle(err))
        }
    }

    if ($shareBtn) {
        $shareBtn.onclick = function (e) {
            const isShare = e.target.checked
            const path = window.location.pathname
            window.fetch(`${path}/setting`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    share: isShare,
                }),
            })
                .then(res => res.json())
                .then(res => {
                    if (res.err !== 0) {
                        return errHandle(res.msg)
                    }

                    if (isShare) {
                        const origin = window.location.origin
                        const url = `${origin}/share/${res.data}`
                        // show modal
                        $shareInput.value = url
                        $shareModal.style.display = 'block'
                    }
                })
                .catch(err => errHandle(err))
        }
    }

    if ($shareModal) {
        $closeBtn.onclick = function () {
            $shareModal.style.display = 'none'

        }
        $copyBtn.onclick = function () {
            clipboardCopy($shareInput.value)
            const originText = $copyBtn.innerHTML
            const originColor = $copyBtn.style.background
            $copyBtn.innerHTML = getI18n('cpys')
            $copyBtn.style.background = 'orange'
            window.setTimeout(() => {
                $shareModal.style.display = 'none'
                $copyBtn.innerHTML = originText
                $copyBtn.style.background = originColor
            }, 1500)
        }
    }

})
