import QtQuick 2.15
import QtQuick.Controls 2.15

Item {
    id: root
    height: 48

    property alias text: inputField.text
    property alias echoMode: inputField.echoMode
    property string placeholder: ""
    property string iconSymbol: ""
    property bool isPassword: false
    property alias inputFocus: inputField.focus
    signal accepted()

    Rectangle {
        id: bg
        anchors.fill: parent
        color: inputField.activeFocus ? "#0d1117fa" : "#0d1117cc"
        radius: 10
        border.width: inputField.activeFocus ? 2 : 1
        border.color: inputField.activeFocus ? "#56d4dd" : "#30363d"

        Behavior on border.color {
            ColorAnimation { duration: 150 }
        }

        // Left Icon
        Text {
            id: iconLabel
            anchors.left: parent.left
            anchors.leftMargin: 14
            anchors.verticalCenter: parent.verticalCenter
            text: root.iconSymbol
            color: inputField.activeFocus ? "#56d4dd" : "#8b949e"
            font.pixelSize: 15
        }

        // Text Input
        TextInput {
            id: inputField
            anchors.left: iconLabel.right
            anchors.leftMargin: 10
            anchors.right: toggleBtn.visible ? toggleBtn.left : parent.right
            anchors.rightMargin: 10
            anchors.verticalCenter: parent.verticalCenter
            color: "#e6f1f5"
            font.pixelSize: 14
            font.family: "Segoe UI, Outfit, sans-serif"
            clip: true
            selectByMouse: true
            selectionColor: "#56d4dd66"
            selectedTextColor: "#ffffff"

            onAccepted: root.accepted()

            Text {
                text: root.placeholder
                color: "#8b949e"
                visible: !inputField.text && !inputField.activeFocus
                anchors.verticalCenter: parent.verticalCenter
                font.pixelSize: 14
                font.family: inputField.font.family
            }
        }

        // Show/Hide Password Toggle
        MouseArea {
            id: toggleBtn
            visible: root.isPassword
            width: 36
            height: 36
            anchors.right: parent.right
            anchors.rightMargin: 6
            anchors.verticalCenter: parent.verticalCenter
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor

            Text {
                anchors.centerIn: parent
                text: inputField.echoMode === TextInput.Password ? "👁" : "🔒"
                color: parent.containsMouse ? "#56d4dd" : "#8b949e"
                font.pixelSize: 14
            }

            onClicked: {
                if (inputField.echoMode === TextInput.Password) {
                    inputField.echoMode = TextInput.Normal;
                } else {
                    inputField.echoMode = TextInput.Password;
                }
            }
        }
    }
}
