import React, { Component, createPortal } from 'react';
import { ChromePicker } from 'react-color';
import { Motion, spring } from 'react-motion';
import { mix as mixColors, darken, lighten, grayscale } from 'polished';
import './Palette.css';

const audioRoot = document.getElementById('audio-root');

class Palette extends Component {
  state = {
    displayColorPicker: false,
    dots: {
      mix: {
        fill: mixColors(0.5, '#D0021B', '#4A90E2'),
        cx: 160, // let's figure this value being random
        active: false,
      },
      left: {
        fill: '#D0021B',
        cx: 80,
      },
      right: {
        fill: '#4A90E2',
        cx: 240,
      },
    },
    activeDot: 'left',
  };

  handleMix = () => {
    this.setState(state => ({
      displayColorPicker: false,
      dots: {
        ...state.dots,
        mix: {
          fill: mixColors(0.5, state.dots.left.fill, state.dots.right.fill),
          active: !state.dots.mix.active,
        },
      },
      activeDot: !state.dots.mix.active ? 'mix' : 'left',
    }));
  };

  handleSelect = dot => () => {
    this.setState(state => ({
      displayColorPicker: true,
      activeDot: state.dots.mix.active ? 'mix' : dot,
    }));
  };

  handleChange = (color, event) => {
    this.setState(state => ({
      dots: {
        ...state.dots,
        [state.activeDot]: {
          ...state.dots[state.activeDot],
          fill: color.hex,
        },
      },
    }));
  };

  handleClose = () => {
    this.setState(() => ({ displayColorPicker: false }));
  };

  render() {
    const wrapper = {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      height: '100vh',
    };

    return (
      <div style={wrapper}>
        <svg viewBox="0 0 320 160">
          <filter id="goo" width="300%" height="300%" x="-100%" y="-100%">
            <feGaussianBlur
              className="blurValue"
              in="SourceGraphic"
              stdDeviation={5}
              result="blur"
            />
            <feColorMatrix
              className="matrix"
              in="blur"
              mode="matrix"
              values="1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,23,-7"
            />
          </filter>
          <g filter="url(#goo)">
            {['left', 'right'].map((dot, index) => (
              <Dot
                key={dot}
                id={dot}
                fill={
                  this.state.dots.mix.active
                    ? this.state.dots.mix.fill
                    : this.state.dots[dot].fill
                }
                isMixActive={this.state.dots.mix.active}
                glowDelay={index / 3}
                onClick={this.handleSelect(dot)}
              />
            ))}
          </g>
        </svg>
        <Button handleMix={this.handleMix} />
        <ColorPicker
          isOpen={this.state.displayColorPicker}
          color={this.state.dots[this.state.activeDot].fill}
          handleChange={this.handleChange}
          handleClose={this.handleClose}
        />
      </div>
    );
  }
}

class Dot extends Component {
  getDirection = id => {
    if (id === 'left') {
      return -1;
    }

    if (id === 'right') {
      return 1;
    }

    return 0;
  };

  render() {
    return [
      <radialGradient
        key="gradient"
        cx="31.38%"
        cy="32.86%"
        fx="31.38%"
        fy="32.86%"
        r="97.59%"
        id={`gradient-${this.props.id}`}
      >
        <stop stopColor={lighten(0.2, this.props.fill)} offset="0%" />
        <stop stopColor={this.props.fill} offset="61.37%" />
        <stop stopColor={darken(0.2, this.props.fill)} offset="100%" />
      </radialGradient>,
      <Motion
        key="circle"
        style={{
          cx: spring(
            this.props.isMixActive
              ? 160
              : 160 - this.getDirection(this.props.id) * 80
          ),
        }}
      >
        {motion => {
          return (
            <g>
              <circle
                style={{
                  transition: 'fill 0.5s ease-out',
                  transformOrigin: 'center center',
                  animation: `glow 3s linear infinite ${-this.props
                    .glowDelay}s`,
                }}
                cy={80}
                r={36}
                fill={`url(#gradient-${this.props.id})`}
                cx={motion.cx}
                onClick={this.props.onClick}
              />
              <ellipse
                style={{
                  transition: 'fill 0.5s ease-out',
                  transformOrigin: 'center center',
                  transform: 'skewY(10px)',
                  animation: `glow 3s linear infinite ${-this.props
                    .glowDelay}s`,
                }}
                cy={150}
                rx={28}
                ry={4}
                fillOpacity={0.9}
                fill={grayscale(this.props.fill)}
                cx={motion.cx}
              />
            </g>
          );
        }}
      </Motion>,
    ];
  }
}

class Button extends Component {
  render() {
    return (
      <button
        style={{
          padding: '1rem 2rem',
          margin: '1rem',
          textTransform: 'uppercase',
          fontSize: '2rem',
          fontFamily: 'Menlo',
          borderRadius: '0.2rem',
          outline: 'none',
        }}
        type="button"
        onClick={this.props.handleMix}
      >
        MIX
      </button>
    );
  }
}

class SoundPlayer extends Component {
  componentDidUpdate(prevProps) {
    if (
      prevProps.type !== this.props.type ||
      prevProps.index !== this.props.index
    ) {
      this.sound.play();
    }
  }

  render() {
    const { type, index } = this.props;

    return (
      <audio
        ref={element => (this.sound = element)}
        // prettier-ignore
        src={`http://facebook.design/public/sounds/${type}${index ? ` ${index}` : ''}.mp3`}
        preload="auto"
      />
    );
  }
}

class ColorPicker extends Component {
  render() {
    const popover = {
      display: 'flex',
      justifyContent: 'center',
      transformOrigin: 'center top',
    };

    const cover = {
      position: 'fixed',
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
    };

    return (
      <Motion
        style={{
          bool: spring(Number(this.props.isOpen), {
            stiffness: 216,
            damping: 17,
          }),
        }}
      >
        {motion => (
          <div
            style={{
              ...popover,
              transform: `scale(1,${motion.bool}`,
              opacity: motion.bool,
            }}
          >
            <SoundPlayer type={this.props.isOpen ? 'Expand' : 'Collapse'} />
            <div style={cover} onClick={this.props.handleClose} />
            <ChromePicker
              color={this.props.color}
              onChange={this.props.handleChange}
            />
          </div>
        )}
      </Motion>
    );
  }
}

export default Palette;
