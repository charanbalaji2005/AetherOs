import QtQuick 2.15
import QtQuick.Controls 2.15

Rectangle {
    id: root
    anchors.fill: parent
    color: "#0a0e1a"

    // Background Wallpaper
    Image {
        id: bg
        anchors.fill: parent
        source: config.background || "/usr/share/backgrounds/aetheros/default.png"
        fillMode: Image.PreserveAspectCrop
        smooth: true
        asynchronous: true
    }

    // Left Split Glass Panel (Matching Reference UI)
    Rectangle {
        id: leftPanel
        width: Math.max(480, parent.width * 0.44)
        height: parent.height
        anchors.left: parent.left
        color: "#0d111cd9" // Deep acrylic frosted glass

        // Right Subtle Glass Border
        Rectangle {
            anchors.right: parent.right
            anchors.top: parent.top
            anchors.bottom: parent.bottom
            width: 1
            color: "#ffffff18"
        }

        // Inner Content Container
        Item {
            anchors.fill: parent
            anchors.margins: 48

            // Top Header: Branding & Clock
            Column {
                id: headerColumn
                anchors.top: parent.top
                anchors.left: parent.left
                anchors.right: parent.right
                spacing: 6

                Text {
                    text: "码农万岁"
                    color: "#ffffffdd"
                    font.pixelSize: 28
                    font.weight: Font.DemiBold
                    font.family: "Outfit, Segoe UI, Noto Sans CJK SC, sans-serif"
                }

                Text {
                    id: clockLabel
                    color: "#ffffff"
                    font.pixelSize: 42
                    font.bold: true
                    font.family: "Outfit, Segoe UI, sans-serif"

                    function updateClock() {
                        clockLabel.text = Qt.formatTime(new Date(), "hh:mm AP");
                    }
                    Component.onCompleted: updateClock()
                }

                Text {
                    id: dateLabel
                    color: "#94a3b8"
                    font.pixelSize: 15
                    font.family: "Outfit, Segoe UI, sans-serif"

                    function updateDate() {
                        dateLabel.text = Qt.formatDate(new Date(), "dddd, d 'of' MMMM");
                    }
                    Component.onCompleted: updateDate()
                }

                Timer {
                    interval: 1000
                    running: true
                    repeat: true
                    onTriggered: {
                        clockLabel.updateClock();
                        dateLabel.updateDate();
                    }
                }
            }

            // Center Login Form
            Column {
                id: loginForm
                anchors.centerIn: parent
                width: parent.width
                spacing: 16

                // Username Capsule
                Rectangle {
                    width: parent.width
                    height: 48
                    radius: 24
                    color: "#182032aa"
                    border.color: userField.activeFocus ? "#00f0ff" : "#ffffff25"
                    border.width: 1.5

                    Row {
                        anchors.fill: parent
                        anchors.leftMargin: 16
                        anchors.rightMargin: 16
                        spacing: 12

                        Text {
                            text: "󰋑"
                            color: "#94a3b8"
                            font.pixelSize: 18
                            anchors.verticalCenter: parent.verticalCenter
                        }

                        TextField {
                            id: userField
                            width: parent.width - 40
                            anchors.verticalCenter: parent.verticalCenter
                            text: userModel.lastUser || "aether"
                            color: "#ffffff"
                            font.pixelSize: 14
                            font.family: "Outfit, Segoe UI, sans-serif"
                            background: Item {}
                            selectByMouse: true
                            onAccepted: passwordField.forceActiveFocus()
                        }
                    }
                }

                // Password Capsule
                Rectangle {
                    width: parent.width
                    height: 48
                    radius: 24
                    color: "#182032aa"
                    border.color: passwordField.activeFocus ? "#ff7849" : "#ff784988"
                    border.width: 1.5

                    Row {
                        anchors.fill: parent
                        anchors.leftMargin: 16
                        anchors.rightMargin: 16
                        spacing: 12

                        Text {
                            text: "󰌾"
                            color: "#ff7849"
                            font.pixelSize: 18
                            anchors.verticalCenter: parent.verticalCenter
                        }

                        TextField {
                            id: passwordField
                            width: parent.width - 40
                            anchors.verticalCenter: parent.verticalCenter
                            placeholderText: "Password"
                            placeholderTextColor: "#64748b"
                            color: "#ffffff"
                            echoMode: showPasswordCheck.checked ? TextInput.Normal : TextInput.Password
                            font.pixelSize: 14
                            font.family: "Outfit, Segoe UI, sans-serif"
                            background: Item {}
                            selectByMouse: true
                            focus: true
                            onAccepted: sddm.login(userField.text, passwordField.text, sessionModel.lastIndex)
                        }
                    }
                }

                // Show Password Checkbox
                Row {
                    spacing: 8
                    CheckBox {
                        id: showPasswordCheck
                        checked: false
                        indicator: Rectangle {
                            implicitWidth: 16
                            implicitHeight: 16
                            radius: 4
                            color: "#182032"
                            border.color: showPasswordCheck.checked ? "#ff7849" : "#ffffff40"
                            Rectangle {
                                width: 8
                                height: 8
                                anchors.centerIn: parent
                                radius: 2
                                color: "#ff7849"
                                visible: showPasswordCheck.checked
                            }
                        }
                    }
                    Text {
                        text: "Show Password"
                        color: "#94a3b8"
                        font.pixelSize: 12
                        anchors.verticalCenter: parent.verticalCenter
                    }
                }

                // Login Button
                Button {
                    id: loginBtn
                    width: parent.width
                    height: 48
                    cursorShape: Qt.PointingHandCursor

                    background: Rectangle {
                        radius: 24
                        gradient: Gradient {
                            GradientStop { position: 0.0; color: "#ff8c42" }
                            GradientStop { position: 1.0; color: "#f95738" }
                        }
                        opacity: loginBtn.down ? 0.85 : 1.0
                    }

                    contentItem: Text {
                        text: "Login"
                        color: "#ffffff"
                        font.pixelSize: 15
                        font.bold: true
                        font.family: "Outfit, Segoe UI, sans-serif"
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }

                    onClicked: sddm.login(userField.text, passwordField.text, sessionModel.lastIndex)
                }

                // Session Indicator
                Text {
                    text: "Session: Hyprland"
                    color: "#64748b"
                    font.pixelSize: 12
                    anchors.horizontalCenter: parent.horizontalCenter
                }
            }

            // Bottom Power Options (Suspend, Reboot, Shutdown)
            Row {
                anchors.bottom: parent.bottom
                anchors.horizontalCenter: parent.horizontalCenter
                spacing: 36

                // Suspend
                Column {
                    spacing: 4
                    anchors.horizontalCenter: undefined
                    Rectangle {
                        width: 44
                        height: 44
                        radius: 22
                        color: "#ffffff10"
                        border.color: "#ffffff20"
                        anchors.horizontalCenter: parent.horizontalCenter
                        Text {
                            text: "󰤄"
                            color: "#ffffff"
                            font.pixelSize: 18
                            anchors.centerIn: parent
                        }
                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: sddm.suspend()
                        }
                    }
                    Text {
                        text: "Suspend"
                        color: "#94a3b8"
                        font.pixelSize: 11
                        anchors.horizontalCenter: parent.horizontalCenter
                    }
                }

                // Reboot
                Column {
                    spacing: 4
                    Rectangle {
                        width: 44
                        height: 44
                        radius: 22
                        color: "#ffffff10"
                        border.color: "#ffffff20"
                        anchors.horizontalCenter: parent.horizontalCenter
                        Text {
                            text: "󰜉"
                            color: "#ffffff"
                            font.pixelSize: 18
                            anchors.centerIn: parent
                        }
                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: sddm.reboot()
                        }
                    }
                    Text {
                        text: "Reboot"
                        color: "#94a3b8"
                        font.pixelSize: 11
                        anchors.horizontalCenter: parent.horizontalCenter
                    }
                }

                // Shutdown
                Column {
                    spacing: 4
                    Rectangle {
                        width: 44
                        height: 44
                        radius: 22
                        color: "#ffffff10"
                        border.color: "#ffffff20"
                        anchors.horizontalCenter: parent.horizontalCenter
                        Text {
                            text: "⏻"
                            color: "#ff5555"
                            font.pixelSize: 18
                            anchors.centerIn: parent
                        }
                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: sddm.powerOff()
                        }
                    }
                    Text {
                        text: "Shutdown"
                        color: "#94a3b8"
                        font.pixelSize: 11
                        anchors.horizontalCenter: parent.horizontalCenter
                    }
                }
            }
        }
    }
}
