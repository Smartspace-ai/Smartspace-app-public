import { ModelRole } from '../enums/model-role';
import { parseDateTime } from '../utils/parse-date-time';
import { ModelConfiguration } from './model-configuration';

export class Workspace {
  id!: string;
  name!: string;
  dataSpaces?: any[];
  createdAt?: Date | string;
  createdByUserId?: string;
  modifiedAt?: Date | string;
  modifiedByUserId?: string;
  prePrompt?: any;
  summary?: string;
  modelConfigurations?: ModelConfiguration[];
  firstPrompt?: string;
  avatarName?: string;
  supportsFiles?: boolean;

  constructor(params?: Workspace) {
    Object.assign(this, params || {});

    if (this.createdAt) {
      this.createdAt = parseDateTime(this.createdAt, 'DD MMM YYYY');
    }

    if (this.modifiedAt) {
      this.modifiedAt = parseDateTime(this.modifiedAt, 'DD MMM YYYY');
    }
    if (this.name) {
      const splitName = this.name.split(' ');
      this.avatarName =
        splitName.length === 1
          ? splitName[0][0]
          : `${splitName[0][0]}${splitName[splitName.length - 1][0]}`;
    }

    // Temporarily add roles to exisitng workspaces
    const hasAgent = (this.modelConfigurations || []).find(
      (mc: ModelConfiguration) => mc.role === ModelRole.Agent
    );

    if (!hasAgent) {
      this.modelConfigurations?.push(
        new ModelConfiguration({ role: ModelRole.Agent })
      );
    }
    const hasDocument = (this.modelConfigurations || []).find(
      (mc: ModelConfiguration) => mc.role === ModelRole.Document
    );
    if (!hasDocument) {
      this.modelConfigurations?.push(
        new ModelConfiguration({ role: ModelRole.Document })
      );
    }
  }
}
