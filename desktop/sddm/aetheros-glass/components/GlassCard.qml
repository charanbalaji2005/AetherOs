import QtQuick 2.15
import QtQuick.Controls 2.15
import QtGraphicalEffects 1.15

Rectangle {
    id: root
    property color glowColor: "#56d4dd"
    property real glowRadius: 16
    property real glowSpread: 0.2

    color: "#161b22e6"
    radius: 16
    border.width: 1
    border.color: "#56d4dd44"
    clip: false

    layer.enabled: true
    layer.effect: DropShadow {
        transparentBorder: true
        horizontalOffset: 0
        verticalOffset: 8
        radius: root.glowRadius
        samples: 24
        color: "#00000088"
        spread: root.glowSpread
    }

    // Top highlight reflection
    Rectangle {
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.right: parent.right
        height: 1
        color: "#ffffff22"
        radius: root.radius
    }
}
