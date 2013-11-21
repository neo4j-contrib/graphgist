window.ColorManager = function () {
    this.registeredLabelColors = {};
    this.prettyColors = [
        {
            bright: "#3498db",
            dim: "#C9D3DB"
        },
        {
            bright: "#1abc9c",
            dim: "#DAE9E6"
        },
        {
            bright: "#e74c3c",
            dim: "#E0D6E6"
        },
        {
            bright: "#C56EF5",
            dim: "#C6BBCC"
        },
        {
            bright: "#FCAB33",
            dim: "#F7DBB7"
        },
        {
            bright: "#2BDAD2",
            dim: "#CEEDEC"
        }
    ];
    this.defaultColor = {bright:"#525864", dim:"#ccc"}
    this.getColorForLabels = function (labels) {
        var color, labelToUse;
        if (!(labels && labels.length > 0)) {
            return this.defaultColor;
        }
        labelToUse = labels[labels.length - 1];
        if (!this.registeredLabelColors[labelToUse]) {
            if (this.prettyColors.length === 0) {
                return this.defaultColor;
            }
            color = this.prettyColors[_.random(0, this.prettyColors.length - 1)];
            this.prettyColors.splice(_.indexOf(this.prettyColors, color), 1);
            this.registeredLabelColors[labelToUse] = color;
        }
        return this.registeredLabelColors[labelToUse];
    };
    return this;
}
