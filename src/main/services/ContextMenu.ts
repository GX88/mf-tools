import { t } from '@main/services/AppLocale';
import type { MenuItemConstructorOptions } from 'electron';
import { Menu } from 'electron';

/**
 * 全局右键菜单管理类
 *
 * - 监听指定 WebContents 的 context-menu 事件
 * - 根据当前选中内容与编辑状态动态生成编辑菜单（复制 / 粘贴 / 剪切）
 * - 提供拼写检查相关的词典建议与「学习拼写」功能
 * - 始终追加「检查元素」用于打开 DevTools
 *
 */
class ContextMenu {
  /**
   * 为指定 WebContents 注册右键菜单
   *
   * @param w 需要绑定右键菜单的 WebContents 实例
   *
   * 逻辑说明：
   * - 在 context-menu 事件中，根据 ContextMenuParams 构造菜单模板
   * - 先生成编辑菜单项，再根据需要拼接检查元素菜单与拼写相关菜单
   * - 过滤掉 visible === false 的菜单项后，构建并弹出菜单
   */
  public contextMenu(w: Electron.WebContents) {
    w.on('context-menu', (_event, properties) => {
      const template: MenuItemConstructorOptions[] = this.createEditMenuItems(properties);
      const filtered = template.filter((item) => item.visible !== false);
      if (filtered.length > 0) {
        let template = [...filtered, ...this.createInspectMenuItems(w)];
        const dictionarySuggestions = this.createDictionarySuggestions(properties, w);
        if (dictionarySuggestions.length > 0) {
          template = [
            ...dictionarySuggestions,
            { type: 'separator' },
            this.createSpellCheckMenuItem(properties, w),
            { type: 'separator' },
            ...template,
          ];
        }
        const menu = Menu.buildFromTemplate(template);
        menu.popup();
      }
    });
  }

  /**
   * 构建「检查元素」菜单项
   *
   * @param w 当前 WebContents
   * @returns 仅包含一个「Inspect」菜单项的数组
   *
   * - 点击时调用 toggleDevTools() 打开或关闭 DevTools
   */
  private createInspectMenuItems(w: Electron.WebContents): MenuItemConstructorOptions[] {
    const template: MenuItemConstructorOptions[] = [
      {
        id: 'inspect',
        label: t('system.contextMenu.inspect'),
        click: () => {
          w.toggleDevTools();
        },
        enabled: true,
      },
    ];

    return template;
  }

  /**
   * 构建编辑相关菜单项（复制 / 粘贴 / 剪切）
   *
   * @param properties context-menu 回调中的参数对象
   *
   * 逻辑说明：
   * - 根据选中文本与 editFlags 判断各操作是否可用
   * - 仅在可编辑区域或存在选中文本时展示对应菜单项
   * - 对 disabled 的菜单项清除 role，避免 Electron 在某些版本中的已知问题
   */
  private createEditMenuItems(properties: Electron.ContextMenuParams): MenuItemConstructorOptions[] {
    const hasText = properties.selectionText.trim().length > 0;
    const can = (type: string) => properties.editFlags[`can${type}`] && hasText;

    const template: MenuItemConstructorOptions[] = [
      {
        id: 'copy',
        label: t('system.edit.copy'),
        role: 'copy',
        enabled: can('Copy'),
        visible: properties.isEditable || hasText,
      },
      {
        id: 'paste',
        label: t('system.edit.paste'),
        role: 'paste',
        enabled: properties.editFlags.canPaste,
        visible: properties.isEditable,
      },
      {
        id: 'cut',
        label: t('system.edit.cut'),
        role: 'cut',
        enabled: can('Cut'),
        visible: properties.isEditable,
      },
    ];

    // remove role from items that are not enabled
    // https://github.com/electron/electron/issues/13554
    template.forEach((item) => {
      if (item.enabled === false) {
        item.role = undefined;
      }
    });

    return template;
  }

  /**
   * 构建「学习拼写」菜单项
   *
   * @param properties context-menu 参数
   * @param w          当前 WebContents
   *
   * - 仅在可编辑区域、有选中文本且存在拼写错误时才展示
   * - 点击时调用 addWordToSpellCheckerDictionary 将单词加入拼写词典
   */
  private createSpellCheckMenuItem(
    properties: Electron.ContextMenuParams,
    w: Electron.WebContents,
  ): MenuItemConstructorOptions {
    const hasText = properties.selectionText.length > 0;

    return {
      id: 'learnSpelling',
      label: '&Learn Spelling',
      visible: Boolean(properties.isEditable && hasText && properties.misspelledWord),
      click: () => {
        w.session.addWordToSpellCheckerDictionary(properties.misspelledWord);
      },
    };
  }

  /**
   * 构建拼写建议菜单项列表
   *
   * @param properties context-menu 参数
   * @param w          当前 WebContents
   *
   * 逻辑说明：
   * - 无选中文本或无拼写错误时，直接返回空数组
   * - 有拼写错误但无建议时，返回一个「No Guesses Found」的禁用菜单项
   * - 否则为每条建议构建一个菜单项，点击后调用 replaceMisspelling 替换为该建议
   */
  private createDictionarySuggestions(
    properties: Electron.ContextMenuParams,
    w: Electron.WebContents,
  ): MenuItemConstructorOptions[] {
    const hasText = properties.selectionText.length > 0;

    if (!hasText || !properties.misspelledWord) {
      return [];
    }

    if (properties.dictionarySuggestions.length === 0) {
      return [
        {
          id: 'dictionarySuggestions',
          label: 'No Guesses Found',
          visible: true,
          enabled: false,
        },
      ];
    }

    return properties.dictionarySuggestions.map((suggestion) => ({
      id: 'dictionarySuggestions',
      label: suggestion,
      visible: Boolean(properties.isEditable && hasText && properties.misspelledWord),
      click: (menuItem: Electron.MenuItem) => {
        w.replaceMisspelling(menuItem.label);
      },
    }));
  }
}

export const contextMenu = new ContextMenu();
