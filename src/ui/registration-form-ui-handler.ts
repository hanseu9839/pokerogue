import type { InputFieldConfig } from "./form-modal-ui-handler";
import { FormModalUiHandler } from "./form-modal-ui-handler";
import type { ModalConfig } from "./modal-ui-handler";
import { Mode } from "./ui";
import { TextStyle, addTextObject } from "./text";
import i18next from "i18next";
import { pokerogueApi } from "#app/plugins/api/pokerogue-api";
import { globalScene } from "#app/global-scene";

interface LanguageSetting {
  inputFieldFontSize?: string;
  warningMessageFontSize?: string;
  errorMessageFontSize?: string;
}

const languageSettings: { [key: string]: LanguageSetting } = {
  "es-ES": {
    inputFieldFontSize: "50px",
    errorMessageFontSize: "40px",
  },
};

export default class RegistrationFormUiHandler extends FormModalUiHandler {
  getModalTitle(_config?: ModalConfig): string {
    return i18next.t("menu:register");
  }

  getWidth(_config?: ModalConfig): number {
    return 160;
  }

  getMargin(_config?: ModalConfig): [number, number, number, number] {
    return [0, 0, 48, 0];
  }

  getButtonTopMargin(): number {
    return 8;
  }

  getButtonLabels(_config?: ModalConfig): string[] {
    return [i18next.t("menu:register"), i18next.t("menu:backToLogin")];
  }

  getReadableErrorMessage(error: string): string {
    const colonIndex = error?.indexOf(":");
    if (colonIndex > 0) {
      error = error.slice(0, colonIndex);
    }
    switch (error) {
      case "invalid username":
        return i18next.t("menu:invalidRegisterUsername");
      case "invalid password":
        return i18next.t("menu:invalidRegisterPassword");
      case "failed to add account record":
        return i18next.t("menu:usernameAlreadyUsed");
    }

    return super.getReadableErrorMessage(error);
  }

  override getInputFieldConfigs(): InputFieldConfig[] {
    const inputFieldConfigs: InputFieldConfig[] = [];
    inputFieldConfigs.push({ label: i18next.t("menu:username") });
    inputFieldConfigs.push({
      label: i18next.t("menu:password"),
      isPassword: true,
    });
    inputFieldConfigs.push({
      label: i18next.t("menu:confirmPassword"),
      isPassword: true,
    });
    return inputFieldConfigs;
  }

  setup(): void {
    super.setup();

    this.modalContainer.list.forEach((child: Phaser.GameObjects.GameObject) => {
      if (child instanceof Phaser.GameObjects.Text && child !== this.titleText) {
        const inputFieldFontSize = languageSettings[i18next.resolvedLanguage!]?.inputFieldFontSize;
        if (inputFieldFontSize) {
          child.setFontSize(inputFieldFontSize);
        }
      }
    });

    const warningMessageFontSize = languageSettings[i18next.resolvedLanguage!]?.warningMessageFontSize ?? "42px";
    const label = addTextObject(10, 87, i18next.t("menu:registrationAgeWarning"), TextStyle.TOOLTIP_CONTENT, {
      fontSize: warningMessageFontSize,
    });

    this.modalContainer.add(label);
  }

  show(args: any[]): boolean {
    if (super.show(args)) {
      const config = args[0] as ModalConfig;

      const originalRegistrationAction = this.submitAction;
      this.submitAction = _ => {
        // Prevent overlapping overrides on action modification
        this.submitAction = originalRegistrationAction;
        this.sanitizeInputs();
        globalScene.ui.setMode(Mode.LOADING, { buttonActions: [] });
        const onFail = error => {
          globalScene.ui.setMode(Mode.REGISTRATION_FORM, Object.assign(config, { errorMessage: error?.trim() }));
          globalScene.ui.playError();
          const errorMessageFontSize = languageSettings[i18next.resolvedLanguage!]?.errorMessageFontSize;
          if (errorMessageFontSize) {
            this.errorMessage.setFontSize(errorMessageFontSize);
          }
        };
        if (!this.inputs[0].text) {
          return onFail(i18next.t("menu:emptyUsername"));
        }
        if (!this.inputs[1].text) {
          return onFail(this.getReadableErrorMessage("invalid password"));
        }
        if (this.inputs[1].text !== this.inputs[2].text) {
          return onFail(i18next.t("menu:passwordNotMatchingConfirmPassword"));
        }
        const [usernameInput, passwordInput] = this.inputs;
        pokerogueApi.account
          .register({
            username: usernameInput.text,
            password: passwordInput.text,
          })
          .then(registerError => {
            if (!registerError) {
              pokerogueApi.account
                .login({
                  username: usernameInput.text,
                  password: passwordInput.text,
                })
                .then(loginError => {
                  if (!loginError) {
                    originalRegistrationAction?.();
                  } else {
                    onFail(loginError);
                  }
                });
            } else {
              onFail(registerError);
            }
          });
      };

      return true;
    }

    return false;
  }
}
