
import common from '../../../lib/common/common.js'
import fs from 'node:fs'
import YAML from 'yaml'
import { _path, pluginRoot } from "./path.js";
import csv from 'csvtojson'


let user_token = {}
const data_path = `${pluginRoot}/data/`
const token_path = `${pluginRoot}/data/user_token.json`

class Film {

    /**YAMLReader
     * @param path 真实路径，包含文件后缀
     * @param style 父路径
     */
    async YamlReader(path, style) {
        try {
            if (!fs.existsSync(`${style}`)) { return false }
            return YAML.parse(fs.readFileSync(`${path}`, 'utf8'))
        } catch (error) {
            logger.warn(`[phi插件][${path}] 读取失败`)
            logger.warn(error)
            return false
        }
    }

    /**JSONReader
     * @param path 真实路径，包含文件后缀
     * @param style 父路径
     */
    async JsonReader(path, style) {
        try {
            if (!fs.existsSync(`${style}`)) { return false }
            return JSON.parse(fs.readFileSync(`${path}`, 'utf8'))
        } catch (error) {
            logger.warn(`[phi插件][${path}] 读取失败`)
            logger.warn(error)
            return false
        }

    }

    /**
     * 读取文件
     * @param {string} path 完整路径
     * @param {'JSON'|'YAML'|'CSV'|'TXT'} [style=undefined] 强制设置文件格式
     */
    async FileReader(path, style = undefined) {
        try {
            if (!fs.existsSync(`${path}`)) { return false }
            if (!style) {
                style = path.match(/\.(\w+)$/g)[0].replace('.', '').toUpperCase()
            }
            switch (style) {
                case 'JSON': {
                    return JSON.parse(fs.readFileSync(`${path}`, 'utf8'))
                }
                case 'YAML': {
                    return YAML.parse(fs.readFileSync(`${path}`, 'utf8'))
                }
                case 'CSV': {
                    return (await csv().fromString(fs.readFileSync(`${path}`, 'utf8')))
                }
                case 'TXT': {
                    return fs.readFileSync(`${path}`, 'utf8')
                }
                default: {
                    logger.error(`[phi插件]不支持的文件格式 ${style}`)
                    return fs.readFileSync(`${path}`, 'utf8')
                }
            }
        } catch (error) {
            logger.warn(`[phi插件][${path}] 读取失败`)
            logger.warn(error)
            return false
        }
    }

    /**
     * 存储文件
     * @param {string} fileName 文件名，含后缀
     * @param {string} fatherPath 父路径
     * @param {any} data 目标数据
     * @param {'JSON'|'YAML'|'TXT'} [style=undefined] 
     */
    async SetFile(fileName, fatherPath, data, style = undefined) {
        try {
            let path = `${fatherPath}${fileName}`
            if (!fs.existsSync(fatherPath)) {
                // 递归创建目录
                fs.mkdirSync(fatherPath, { recursive: true });
            }
            if (!style) {
                style = path.match(/\.(\w+)$/g)[0].replace('.', '').toUpperCase()
            }
            switch (style) {
                case 'JSON': {
                    fs.writeFileSync(`${path}`, JSON.stringify(data), 'utf8')
                    break
                }
                case 'YAML': {
                    fs.writeFileSync(`${path}`, YAML.stringify(data), 'utf8')
                    break
                }
                case 'TXT': {
                    fs.writeFileSync(`${path}`, data, 'utf8')
                }
                default: {
                    logger.error(`[phi插件]不支持的文件格式 ${style}`)
                    fs.writeFileSync(`${path}`, data, 'utf8')
                    break
                }
            }
            return true
        } catch (error) {
            logger.warn(`[phi插件]写入文件 ${fatherPath}${fileName} 时遇到错误`)
            logger.warn(error)
            return false
        }
    }

    /**保存Yaml文件
     * @param path 真实路径，包含文件后缀
     * @param data 覆写内容
     * @param style 父路径
     */
    async SetYaml(path, data, style) {
        try {
            if (!fs.existsSync(style)) {
                // 递归创建目录
                fs.mkdirSync(style, { recursive: true });
            }
            fs.writeFileSync(`${path}`, YAML.stringify(data), 'utf8')
        } catch (error) {
            logger.warn(`[phi插件]写入文件 ${path} 时遇到错误`)
            logger.warn(error)
            return false
        }
    }

    /**保存Json文件
     * @param path 真实路径，包含文件后缀
     * @param data 覆写内容
     * @param style 父路径
     */
    async SetJson(path, data, style) {
        try {
            if (!fs.existsSync(style)) {
                // 递归创建目录
                fs.mkdirSync(style, { recursive: true });
            }
            fs.writeFileSync(`${path}`, JSON.stringify(data), 'utf8')
        } catch (error) {
            logger.warn(`[phi插件]写入文件 ${path} 时遇到错误`)
            logger.warn(error)
            return false
        }
    }


    async DelFile(path) {
        try {
            if (!fs.existsSync(`${path}`)) { return false }
            fs.unlink(`${path}`, (err) => {
                if (err) throw err
            })
            return true
        } catch (error) {
            logger.warn(`[phi插件][${path}] 删除失败`)
            logger.warn(error)
            return false
        }
    }

    async add_user_token(user_id, session) {
        user_token[user_id] = session
        await this.SetFile('user_token.json', data_path, user_token)
    }

    async get_user_token(user_id) {
        return user_token[user_id]
    }

    async del_user_token(user_id) {
        delete user_token[user_id]
        await this.SetFile('user_token.json', data_path, user_token)
    }

    /**
     * 删除指定路径下的所有空文件夹
     * @param {*} path 
     */
    async rmEmptyDir(path, level = 0) {
        if (!fs.existsSync(path)) return false
        if (!fs.lstatSync(path).isDirectory()) return false
        const files = fs.readdirSync(path);
        if (files.length > 0) {
            let tempFile = 0;
            files.forEach(file => {
                tempFile++;
                this.rmEmptyDir(`${path}/${file}`, 1);
            });
            if (tempFile === files.length && level !== 0 && fs.lstatSync(path).isDirectory()) {
                try {
                    fs.rmdirSync(path);
                } catch { }
            }
        }
        else {
            if (fs.lstatSync(path).isDirectory()) {
                try {
                    fs.rmdirSync(path);
                } catch { }
            }
        }
    }

    /**更改数据储存位置 */
    async movJsonFile(path) {
        if (!fs.existsSync(`${path}`)) { return false }
        const files = fs.readdirSync(path);

        if (files.length > 0) {

            let tot = 0
            let already = 0
            files.forEach(file => {
                if (!fs.lstatSync(`${path}/${file}`).isDirectory() && file != 'user_token.json') {
                    ++tot
                }
            });
            files.forEach(file => {
                if (!fs.lstatSync(`${path}/${file}`).isDirectory() && file != 'user_token.json') {
                    let user_id = file.replace('.json', '')
                    this.FileReader(`${path}/${file}`).then((json) => {
                        if (json) {
                            let session = json.session
                            /**保存user_id和session映射 */
                            user_token[user_id] = session
                            ++already
                            logger.mark('[phi-plugin][数据整合]', `${already}/${tot}`)
                            if (this.SetFile('save.json', `${path}/saveData/${session}/`, json, 'JSON')) {
                                this.FileReader(`${path}/pluginData/${user_id}_.json`).then((json_) => {
                                    if (json_) {
                                        let tem_file = {
                                            data: json_.data,
                                            rks: json_.rks,
                                            scoreHistory: json_.scoreHistory,
                                            dan: json_.dan,
                                        }
                                        this.SetFile('history.json', `${path}/saveData/${session}/`, tem_file, 'JSON')
                                    }
                                })
                                fs.rmSync(`${path}/${file}`)
                            }
                        }
                    })
                }
            });

            async function check() {
                let count = 0 //循环次数
                while (already < tot) {
                    await common.sleep(1000);
                    ++count
                    if (count > 200) {
                        logger.mark('[phi-plugin][数据整合]', `${already}/${tot}`)
                        break
                    }
                }
            }

            await check()
            await this.SetFile('user_token.json', data_path, user_token)


        }
    }
}


user_token = await new Film().FileReader(token_path) || {}

export default new Film()