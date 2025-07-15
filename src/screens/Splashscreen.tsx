import { View, Image, StyleSheet } from "react-native";

export default function Splashscreen() {
    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#142A42',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 320,
        height: 320,
        marginBottom: 0,
    },
});