import { create } from 'zustand';
import { Howl } from 'howler';

type AudioStore = {
    initVolume: number; // 初始音量
    sounds: { [key: string]: { pool: Howl[]; index: number, type?: string } }; // 音效池
    play: (name: string, config?: {
        volume?: number
        sprite?: string
    }) => void;
    setVolume: (name: string, volume: number) => void;
    setAllVolume: (volume: number) => void;
    stop: (name: string) => void;
    addSound: (name: string, src: string, config?: {
        volume?: number,
        sprite?: { [key: string]: [number, number] },
        poolSize?: number,
        loop?: boolean,
        type?: string
    }) => void;
    removeSound: (name: string) => void;
    removeSoundByType: (type: string) => void;
};

// 初始化音效
const initializeSoundsWithPool = (): Record<string, { pool: Howl[]; index: number }> => {
    const sounds: Record<string, { pool: Howl[]; index: number }> = {};
    const audioList: {
        name: string; src: string; volume?: number, sprite?: {
            [key: string]: [number, number];
        }, poolSize?: number, loop?: boolean
    }[] = [
            { name: 'buttonClick', src: 'nier/sound/sfx/buttonClick.ogg', volume: 0.3, },
            { name: 'playerShot', src: 'nier/sound/sfx/playerShot1.ogg', volume: 0.3, poolSize: 3 },
            { name: 'enemyHit', src: 'nier/sound/sfx/enemyHit.ogg', volume: 0.3, poolSize: 3 },
            { name: 'coreExplode1', src: 'nier/sound/sfx/coreExplode1.ogg', volume: 0.3 },
            { name: 'playerExplode', src: 'nier/sound/sfx/playerExplode.ogg', volume: 0.3 },
            { name: 'playerHit', src: 'nier/sound/sfx/playerHit.ogg', volume: 0.3 },
            { name: 'Weight of the World', src: 'nier/sound/music/Weight of the World - 8 bit.mp3', volume: 0.3, loop: true },
        ];

    audioList.forEach((audio) => {
        sounds[audio.name] = {
            pool: Array.from({ length: audio.poolSize || 1 }, () =>
                new Howl({
                    src: [audio.src],
                    volume: audio.volume || 1.0,
                    html5: true, // 如果需要 HTML5 模式
                    loop: audio.loop,
                })
            ),
            index: 0, // 当前池的索引
        };
    });

    return sounds;
};

// 创建 Zustand Store
const useAudioStore = create<AudioStore>((set, get) => ({
    initVolume: 0.3, // 初始音量
    sounds: initializeSoundsWithPool(), // 在 Store 初始化时加载音效

    // 播放音效
    play: (name: string, config?: { volume?: number; sprite?: string }) => {
        const soundPool = get().sounds[name];
        if (soundPool) {
            const { pool, index } = soundPool;
            // 从池中取出当前索引的音效
            const sound = pool[index];
            // 如果音效正在播放，先停止它
            if (sound.playing()) {
                sound.stop();
            }
            // 播放音效
            if (config?.volume) sound.volume(config.volume);
            sound.play(config?.sprite ?? undefined);

            // 更新池的索引，循环回到头部
            soundPool.index = (index + 1) % pool.length;
        } else {
            console.warn(`Audio "${name}" not found!`);
        }
    },

    // 设置音效音量
    setVolume: (name: string, volume: number) => {
        const soundPool = get().sounds[name];
        if (soundPool) {
            soundPool.pool.forEach((sound) => sound.volume(volume));
        } else {
            console.warn(`Audio "${name}" not found!`);
        }
    },

    // 设置所有音效音量
    setAllVolume: (volume: number) => {
        Object.values(get().sounds).forEach((soundPool) => {
            soundPool.pool.forEach((sound) => sound.volume(volume));
        });
    },
    // 停止音效
    stop: (name: string) => {
        const soundPool = get().sounds[name];
        if (soundPool) {
            soundPool.pool.forEach((sound) => sound.stop());
        } else {
            console.warn(`Audio "${name}" not found!`);
        }
    },

    // 添加音效
    addSound: (name: string, src: string, config?: {
        volume?: number, sprite?: { [key: string]: [number, number] }, poolSize?: number, type?: string, loop?: boolean
    }) => {
        const soundPool = get().sounds[name];
        if (soundPool) {
            console.warn(`Audio "${name}" already exists!`);
            return;
        }

        get().sounds[name] = {
            pool: Array.from({ length: config?.poolSize || 1 }, () =>
                new Howl({
                    src: [src],
                    volume: config?.volume || 1.0,
                    sprite: config?.sprite,
                    html5: true,
                    loop: config?.loop,
                })
            ),
            index: 0, // 当前池的索引
            type: config?.type,
        };
    },

    // 移除音效
    removeSound: (name: string) => {
        const soundPool = get().sounds[name];
        if (soundPool) {
            soundPool.pool.forEach((sound) => sound.unload());
            delete get().sounds[name];
        } else {
            console.warn(`Audio "${name}" not found!`);
        }
    },

    // 移除指定类型的音效
    removeSoundByType: (type: string) => {
        Object.entries(get().sounds).forEach(([name, soundPool]) => {
            if (soundPool.type === type) {
                soundPool.pool.forEach((sound) => sound.unload());
                delete get().sounds[name];
            }
        });
    },
}));

export default useAudioStore;
