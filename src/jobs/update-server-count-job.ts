import { ShardingManager } from 'discord.js';
import schedule from 'node-schedule';

import { BotSiteConfig, ConfigSchema } from '../models/config-models';
import { LogsSchema } from '../models/logs';
import { HttpService, Logger } from '../services';
import { ShardUtils } from '../utils';
import { Job } from './job';

let Config: ConfigSchema = require('../../config/config.json');
let BotSites: BotSiteConfig[] = require('../../config/bot-sites.json');
let Logs: LogsSchema = require('../../lang/logs.en.json');

export class UpdateServerCountJob implements Job {
    private botSites: BotSiteConfig[];

    constructor(
        public schedule: string,
        private shardManager: ShardingManager,
        private httpService: HttpService
    ) {
        this.botSites = BotSites.filter(botSite => botSite.enabled);
    }

    public async run(): Promise<void> {
        let serverCount = await ShardUtils.retrieveServerCount(this.shardManager);
        await this.shardManager.broadcastEval(`
            this.user.setPresence({
                activity: {
                    name: 'time to ${serverCount.toLocaleString()} servers',
                    type: "STREAMING",
                    url: "${Config.links.stream}"
                }
            });
        `);

        Logger.info(
            Logs.updatedServerCount.replace('{SERVER_COUNT}', serverCount.toLocaleString())
        );

        for (let botSite of this.botSites) {
            try {
                let body = JSON.parse(
                    botSite.body.replace('{{SERVER_COUNT}}', serverCount.toString())
                );
                let res = await this.httpService.post(botSite.url, botSite.authorization, body);

                if (!res.ok) {
                    throw res;
                }
            } catch (error) {
                Logger.error(
                    Logs.updateServerCountSiteError.replace('{BOT_SITE}', botSite.name),
                    error
                );
                continue;
            }

            Logger.info(Logs.updateServerCountSite.replace('{BOT_SITE}', botSite.name));
        }
    }

    public start(): void {
        schedule.scheduleJob(this.schedule, async () => {
            try {
                await this.run();
            } catch (error) {
                Logger.error(Logs.updateServerCountError, error);
            }
        });
    }
}
