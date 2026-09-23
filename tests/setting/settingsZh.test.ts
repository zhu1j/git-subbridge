import { describe, expect, test } from "vitest";
import { translateSettingsText } from "../../src/setting/settingsZh";

describe("settings Chinese translations", () => {
    test("translates static settings labels", () => {
        expect(translateSettingsText("Automatic")).toBe("自动");
        expect(translateSettingsText("Metadata mode")).toBe("元数据模式");
        expect(translateSettingsText("Language")).toBe("语言");
        expect(translateSettingsText("Nested repositories")).toBe("嵌套仓库");
    });

    test("translates dynamic setting descriptions", () => {
        expect(
            translateSettingsText(
                "Pull changes every X minutes. Set to 0 (default) to disable."
            )
        ).toBe("每隔 X 分钟拉取一次。设置为 0（默认）可禁用。");
    });
});
