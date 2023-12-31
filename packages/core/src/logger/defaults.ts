import { RnvApiChalk } from '../api/types';

const _chalkPass = (v: string | boolean): string => (typeof v === 'string' ? v : String(v));

//TODO: convert this to properly overloaded class
export const generateDefaultChalk = (): RnvApiChalk => {
    const chalk: any = {
        white: (v: string | boolean) => _chalkPass(v),
        green: (v: string) => _chalkPass(v),
        red: (v: string) => _chalkPass(v),
        yellow: (v: string) => _chalkPass(v),
        default: (v: string) => _chalkPass(v),
        gray: (v: string) => _chalkPass(v),
        grey: (v: string) => _chalkPass(v),
        blue: (v: string) => _chalkPass(v),
        cyan: (v: string) => _chalkPass(v),
        magenta: (v: string) => _chalkPass(v),
        rgb: () => (v: string) => _chalkPass(v),
    };
    chalk.bold = chalk;
    return chalk;
};
