import QtQuick 2.12
import QtQuick.Controls 2.12

Rectangle {
    id: container
    anchors.fill: parent
    color: "#0d1117"

    // Background Image
    Image {
        id: bgImage
        anchors.fill: parent
        source: config.background || "/usr/share/backgrounds/aetheros/default.png"
        fillMode: Image.PreserveAspectCrop
        smooth: true
        asynchronous: true
    }

    // Frosted Glass Dark Vignette Overlay
    Rectangle {
        anchors.fill: parent
        color: "#00000055"
    }

    // Top-Right Minimalist Status Bar (Battery, Wi-Fi, 12:02 PM Clock)
    Item {
        id: topBar
        anchors.top: parent.top
        anchors.right: parent.right
        height: 48
        anchors.margins: 18

        Row {
            anchors.right: parent.right
            anchors.verticalCenter: parent.verticalCenter
            spacing: 16

            // Battery
            Row {
                spacing: 5
                anchors.verticalCenter: parent.verticalCenter
                Text {
                    text: "100%"
                    color: "#ffffff"
                    font.pixelSize: 13
                    font.family: "Segoe UI, Outfit, sans-serif"
                    anchors.verticalCenter: parent.verticalCenter
                }
                Text {
                    text: "󰁹"
                    color: "#57e389"
                    font.pixelSize: 15
                    anchors.verticalCenter: parent.verticalCenter
                }
            }

            // Wi-Fi
            Text {
                text: "󰤨"
                color: "#ffffff"
                font.pixelSize: 15
                anchors.verticalCenter: parent.verticalCenter
            }

            // Real-Time Clock
            Text {
                id: clockText
                color: "#ffffff"
                font.pixelSize: 13
                font.bold: true
                font.family: "Segoe UI, Outfit, sans-serif"
                anchors.verticalCenter: parent.verticalCenter

                function updateTime() {
                    clockText.text = Qt.formatTime(new Date(), "h:mm AP");
                }

                Component.onCompleted: updateTime()

                Timer {
                    interval: 1000
                    running: true
                    repeat: true
                    onTriggered: clockText.updateTime()
                }
            }
        }
    }

    // Center Login Card
    Item {
        id: loginCenter
        width: 360
        height: 320
        anchors.centerIn: parent

        Column {
            anchors.centerIn: parent
            spacing: 16

            // 1. Circular Avatar Container
            Item {
                id: avatarItem
                width: 96
                height: 96
                anchors.horizontalCenter: parent.horizontalCenter

                Rectangle {
                    id: avatarBg
                    anchors.fill: parent
                    radius: 48
                    color: "#161b22"
                    border.width: 2
                    border.color: "#ffffffcc"

                    Image {
                        id: avatarImg
                        anchors.fill: parent
                        anchors.margins: 3
                        source: "assets/avatar.png"
                        fillMode: Image.PreserveAspectCrop
                        smooth: true
                    }
                }

                // Breathing Halo
                Rectangle {
                    anchors.fill: parent
                    radius: 48
                    color: "transparent"
                    border.width: 2
                    border.color: "#56d4dd66"
                    scale: 1.06

                    SequentialAnimation on opacity {
                        loops: Animation.Infinite
                        NumberAnimation { from: 0.3; to: 0.8; duration: 1500; easing.type: Easing.InOutSine }
                        NumberAnimation { from: 0.8; to: 0.3; duration: 1500; easing.type: Easing.InOutSine }
                    }
                }
            }

            // 2. Username Text
            Text {
                id: userNameLabel
                anchors.horizontalCenter: parent.horizontalCenter
                text: (typeof userModel !== "undefined" && userModel.lastUser) ? userModel.lastUser : "aether"
                color: "#ffffff"
                font.pixelSize: 18
                font.bold: true
                font.family: "Segoe UI, Outfit, sans-serif"
                style: Text.Raised
                styleColor: "#00000099"
            }

            // 3. Translucent Pill Password Input
            Row {
                id: inputRow
                anchors.horizontalCenter: parent.horizontalCenter
                spacing: 8

                // Switch User Button
                Rectangle {
                    id: switchUserBtn
                    width: 36
                    height: 36
                    radius: 18
                    anchors.verticalCenter: parent.verticalCenter
                    color: switchMouse.containsMouse ? "#ffffff44" : "#ffffff24"
                    border.width: 1
                    border.color: "#ffffff55"

                    Text {
                        anchors.centerIn: parent
                        text: "❮"
                        color: "#ffffff"
                        font.pixelSize: 12
                        font.bold: true
                    }

                    MouseArea {
                        id: switchMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: {
                            if (typeof userModel !== "undefined" && userModel.count > 1) {
                                userModel.nextUser();
                            }
                        }
                    }
                }

                // Password Pill Field
                Rectangle {
                    id: passwordPill
                    width: 240
                    height: 38
                    radius: 19
                    anchors.verticalCenter: parent.verticalCenter
                    color: passwordInput.activeFocus ? "#ffffff44" : "#ffffff28"
                    border.width: 1
                    border.color: passwordInput.activeFocus ? "#56d4dd" : "#ffffff66"

                    TextInput {
                        id: passwordInput
                        anchors.left: parent.left
                        anchors.leftMargin: 16
                        anchors.right: submitBtn.left
                        anchors.rightMargin: 6
                        anchors.verticalCenter: parent.verticalCenter
                        color: "#ffffff"
                        font.pixelSize: 14
                        font.family: "Segoe UI, Outfit, sans-serif"
                        echoMode: TextInput.Password
                        focus: true
                        clip: true
                        selectByMouse: true

                        Text {
                            text: "Enter Password"
                            color: "#ffffff99"
                            visible: !passwordInput.text && !passwordInput.activeFocus
                            anchors.verticalCenter: parent.verticalCenter
                            font.pixelSize: 13
                        }

                        onAccepted: submitPassword()
                    }

                    // Submit Button inside Pill
                    Rectangle {
                        id: submitBtn
                        width: 28
                        height: 28
                        radius: 14
                        anchors.right: parent.right
                        anchors.rightMargin: 5
                        anchors.verticalCenter: parent.verticalCenter
                        color: submitMouse.containsMouse ? "#56d4ddee" : (passwordInput.text ? "#ffffff44" : "transparent")

                        Text {
                            anchors.centerIn: parent
                            text: "➔"
                            color: "#ffffff"
                            font.pixelSize: 13
                            font.bold: true
                        }

                        MouseArea {
                            id: submitMouse
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.PointingHandCursor
                            onClicked: submitPassword()
                        }
                    }
                }
            }

            // Error notice
            Text {
                id: errorNotice
                anchors.horizontalCenter: parent.horizontalCenter
                text: "Incorrect Password"
                color: "#ff6b6b"
                font.pixelSize: 12
                font.bold: true
                visible: false
            }
        }

        // Horizontal Shake Animation on Error
        SequentialAnimation {
            id: shakeAnimation
            NumberAnimation { target: loginCenter; property: "anchors.horizontalCenterOffset"; from: 0; to: -15; duration: 50 }
            NumberAnimation { target: loginCenter; property: "anchors.horizontalCenterOffset"; from: -15; to: 15; duration: 50 }
            NumberAnimation { target: loginCenter; property: "anchors.horizontalCenterOffset"; from: 15; to: -10; duration: 50 }
            NumberAnimation { target: loginCenter; property: "anchors.horizontalCenterOffset"; from: -10; to: 10; duration: 50 }
            NumberAnimation { target: loginCenter; property: "anchors.horizontalCenterOffset"; from: 10; to: 0; duration: 50 }
        }
    }

    function submitPassword() {
        errorNotice.visible = false;
        loadingOverlay.visible = true;
        if (typeof sddm !== "undefined") {
            sddm.login(userNameLabel.text, passwordInput.text, 0);
        } else {
            console.log("SDDM demo submit for:", userNameLabel.text);
        }
    }

    // Bottom Center Power Controls (Sleep, Restart, Shut Down)
    Item {
        id: bottomPowerSection
        anchors.bottom: parent.bottom
        anchors.horizontalCenter: parent.horizontalCenter
        height: 90
        anchors.bottomMargin: 24

        Row {
            anchors.centerIn: parent
            spacing: 36

            // Sleep
            Column {
                spacing: 6
                Rectangle {
                    width: 44
                    height: 44
                    radius: 22
                    anchors.horizontalCenter: parent.horizontalCenter
                    color: sleepMouse.containsMouse ? "#ffffff33" : "#ffffff18"
                    border.width: 1.5
                    border.color: sleepMouse.containsMouse ? "#7cc7ff" : "#ffffff88"

                    Text {
                        anchors.centerIn: parent
                        text: "󰤄"
                        color: "#ffffff"
                        font.pixelSize: 18
                    }

                    MouseArea {
                        id: sleepMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: {
                            if (typeof sddm !== "undefined") sddm.suspend();
                        }
                    }
                }
                Text {
                    anchors.horizontalCenter: parent.horizontalCenter
                    text: "Sleep"
                    color: "#ffffffdd"
                    font.pixelSize: 11
                }
            }

            // Restart
            Column {
                spacing: 6
                Rectangle {
                    width: 44
                    height: 44
                    radius: 22
                    anchors.horizontalCenter: parent.horizontalCenter
                    color: restartMouse.containsMouse ? "#ffffff33" : "#ffffff18"
                    border.width: 1.5
                    border.color: restartMouse.containsMouse ? "#f5d76e" : "#ffffff88"

                    Text {
                        anchors.centerIn: parent
                        text: "󰜉"
                        color: "#ffffff"
                        font.pixelSize: 18
                    }

                    MouseArea {
                        id: restartMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: {
                            if (typeof sddm !== "undefined") sddm.reboot();
                        }
                    }
                }
                Text {
                    anchors.horizontalCenter: parent.horizontalCenter
                    text: "Restart"
                    color: "#ffffffdd"
                    font.pixelSize: 11
                }
            }

            // Shut Down
            Column {
                spacing: 6
                Rectangle {
                    width: 44
                    height: 44
                    radius: 22
                    anchors.horizontalCenter: parent.horizontalCenter
                    color: powerMouse.containsMouse ? "#ffffff33" : "#ffffff18"
                    border.width: 1.5
                    border.color: powerMouse.containsMouse ? "#f85149" : "#ffffff88"

                    Text {
                        anchors.centerIn: parent
                        text: "⏻"
                        color: "#ffffff"
                        font.pixelSize: 18
                    }

                    MouseArea {
                        id: powerMouse
                        anchors.fill: parent
                        hoverEnabled: true
                        cursorShape: Qt.PointingHandCursor
                        onClicked: {
                            if (typeof sddm !== "undefined") sddm.powerOff();
                        }
                    }
                }
                Text {
                    anchors.horizontalCenter: parent.horizontalCenter
                    text: "Shut Down"
                    color: "#ffffffdd"
                    font.pixelSize: 11
                }
            }
        }
    }

    // Loading Screen Overlay
    Rectangle {
        id: loadingOverlay
        anchors.fill: parent
        color: "#000000aa"
        visible: false
        z: 999

        Column {
            anchors.centerIn: parent
            spacing: 20

            Item {
                width: 60
                height: 60
                anchors.horizontalCenter: parent.horizontalCenter

                Rectangle {
                    anchors.fill: parent
                    radius: 30
                    color: "transparent"
                    border.width: 3
                    border.color: "#56d4dd"

                    RotationAnimation on rotation {
                        from: 0
                        to: 360
                        duration: 1000
                        loops: Animation.Infinite
                        running: loadingOverlay.visible
                    }
                }
            }

            Text {
                anchors.horizontalCenter: parent.horizontalCenter
                text: "Loading AetherOS Desktop..."
                color: "#ffffff"
                font.pixelSize: 15
                font.bold: true
            }
        }
    }

    // SDDM Signal Handlers
    Connections {
        target: (typeof sddm !== "undefined") ? sddm : null
        function onLoginFailed() {
            loadingOverlay.visible = false;
            passwordInput.text = "";
            errorNotice.visible = true;
            passwordInput.focus = true;
            shakeAnimation.start();
        }
        function onLoginSucceeded() {
            errorNotice.visible = false;
        }
    }
}
