import { Switch, rem, useMantineColorScheme, useMantineTheme } from "@mantine/core";
import { IconMoonStars, IconSun } from "@tabler/icons-react";

const SunIcon = () => {
    const theme = useMantineTheme()
    return (
        <IconSun
            style={{ width: rem(16), height: rem(16) }}
            stroke={2.5}
            color={theme.colors.yellow[4]}
        />
    )
}

const MoonIcon = () => {
    const theme = useMantineTheme()
    return (
        <IconMoonStars
            style={{ width: rem(16), height: rem(16) }}
            stroke={2.5}
            color={theme.colors.blue[6]}
        />
    )
}

export default function ThemeButton() {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    return (
        <Switch
            size='md'
            color={colorScheme === 'dark' ? 'dark.4' : 'blue'}
            onLabel={<SunIcon />}
            offLabel={<MoonIcon />}
            checked={colorScheme === 'light'}
            onChange={() => toggleColorScheme()}
        />
    );
}