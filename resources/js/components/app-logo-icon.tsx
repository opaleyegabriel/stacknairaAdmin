import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <img src="/StackNaira-app/StackNaira/icon.jpg" alt="App Logo" {...(props as any)} />
    );
}
