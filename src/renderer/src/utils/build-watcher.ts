/**
 * Next.js Build Watcher 风格的自定义 Loading 组件
 * 基于 Next.js 开发服务器的构建监视器
 */

export function createBuildWatcherLoading() {
  // 创建 Shadow DOM 宿主
  const shadowHost = document.createElement('div')
  shadowHost.id = '__custom-build-watcher'
  shadowHost.style.position = 'fixed'
  shadowHost.style.bottom = '0'
  shadowHost.style.right = '20px'
  shadowHost.style.width = '0'
  shadowHost.style.height = '0'
  shadowHost.style.zIndex = '99999'
  document.body.appendChild(shadowHost)

  // 创建 Shadow DOM
  const shadowRoot = shadowHost.attachShadow({ mode: 'open' })
  const prefix = 'custom-'

  // 最小显示时间控制
  let showStartTime = 0
  let hideTimeout: NodeJS.Timeout | null = null
  const MIN_DISPLAY_TIME = 2000 // 最少显示3秒

  // 创建容器
  const container = document.createElement('div')
  container.id = `${prefix}container`
  container.innerHTML = `
    <div id="${prefix}icon-wrapper">
      <svg viewBox="0 0 226 200">
        <defs>
          <linearGradient
            x1="114.720775%"
            y1="181.283245%"
            x2="39.5399306%"
            y2="100%"
            id="${prefix}linear-gradient"
          >
            <stop stop-color="#000000" offset="0%" />
            <stop stop-color="#FFFFFF" offset="100%" />
          </linearGradient>
        </defs>
        <g id="${prefix}icon-group" fill="none" stroke="url(#${prefix}linear-gradient)" stroke-width="18">
          <path d="M113,5.08219117 L4.28393801,197.5 L221.716062,197.5 L113,5.08219117 Z" />
        </g>
      </svg>
    </div>
  `
  shadowRoot.appendChild(container)

  // 创建 CSS
  const css = document.createElement('style')
  css.textContent = `
    #${prefix}container {
      position: absolute;
      bottom: -50px;
      right: 0px;

      border-radius: 3px;
      background: #000;
      color: #fff;
      font: initial;
      cursor: initial;
      letter-spacing: initial;
      text-shadow: initial;
      text-transform: initial;
      visibility: initial;

      padding: 6px 11px 14px 11px;
      align-items: center;
      box-shadow: 0 11px 40px 0 rgba(0, 0, 0, 0.25), 0 2px 10px 0 rgba(0, 0, 0, 0.12);

      display: none;
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    #${prefix}container.${prefix}visible {
      display: flex;
    }

    #${prefix}container.${prefix}building {
      bottom: 20px;
      opacity: 1;
      transform: translateY(0);
    }

    #${prefix}container.${prefix}hiding {
      bottom: -50px;
      opacity: 0;
      transform: translateY(-20px);
    }

    #${prefix}icon-wrapper {
      width: 16px;
      height: 16px;
    }

    #${prefix}icon-wrapper > svg {
      width: 100%;
      height: 100%;
    }

    #${prefix}icon-group {
      animation: ${prefix}strokedash 1s ease-in-out both infinite;
    }

    @keyframes ${prefix}strokedash {
      0% {
        stroke-dasharray: 0 226;
      }
      80%,
      100% {
        stroke-dasharray: 659 226;
      }
    }
  `
  shadowRoot.appendChild(css)

  // 控制显示/隐藏
  return {
    show: () => {
      // 记录显示时间
      showStartTime = Date.now()

      // 清除之前的隐藏定时器
      if (hideTimeout) {
        clearTimeout(hideTimeout)
        hideTimeout = null
      }

      container.classList.add(`${prefix}visible`)
      // 使用 requestAnimationFrame 确保样式应用
      requestAnimationFrame(() => {
        container.classList.add(`${prefix}building`)
      })
    },
    hide: () => {
      const elapsedTime = Date.now() - showStartTime
      const remainingTime = Math.max(0, MIN_DISPLAY_TIME - elapsedTime)

      // 如果已经显示了足够时间，立即隐藏
      if (remainingTime === 0) {
        performHide()
      } else {
        // 否则等待剩余时间
        hideTimeout = setTimeout(performHide, remainingTime)
      }
    },
    destroy: () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout)
        hideTimeout = null
      }

      if (shadowHost.parentNode) {
        shadowHost.parentNode.removeChild(shadowHost)
      }
    }
  }

  // 执行隐藏操作
  function performHide() {
    container.classList.remove(`${prefix}building`)
    container.classList.add(`${prefix}hiding`)
    setTimeout(() => {
      container.classList.remove(`${prefix}hiding`)
      container.classList.remove(`${prefix}visible`)
    }, 400)
  }
}
