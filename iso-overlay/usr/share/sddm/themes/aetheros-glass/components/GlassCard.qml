import QtQuick 2.15
import QtQuick.Controls 2.15

Item {
    id: root
    property color glowColor: "#56d4dd"
    property real glowRadius: 16
    property real glowSpread: 0.2
    property alias color: backgroundRect.color
    property alias radius: backgroundRect.radius
    property alias border: backgroundRect.border
    default property alias data: backgroundRect.data

    // Ambient drop shadow rectangle
    Rectangle {
        id: shadowRect
        anchors.fill: parent
        anchors.margins: -4
        anchors.topMargin: 4
        radius: root.glowRadius + 2
        color: "#55000000"
        z: -1
    }

    // Glass panel rectangle
    Rectangle {
        id: backgroundRect
        anchors.fill: parent
        color: "#161b22e6"
        radius: 16
        border.width: 1
        border.color: "#56d4dd44"
        clip: false

        // Top highlight reflection
        Rectangle {
            anchors.top: parent.top
            anchors.left: parent.left
            anchors.right: parent.right
            height: 1
            color: "#ffffff22"
            radius: backgroundRect.radius
        }
    }
}
