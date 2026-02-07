import { CardStyles, ListStyles, ButtonStyles, InputStyles, SectionStyles, ModalStyles, ProgressStyles, SharedStyles } from '../SharedStyles';

describe('SharedStyles Constants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CardStyles', () => {
    it('should be defined', () => {
      expect(CardStyles).toBeDefined();
    });

    it('should have expected card style keys', () => {
      expect(CardStyles.card).toBeDefined();
      expect(CardStyles.cardFullWidth).toBeDefined();
      expect(CardStyles.cardHeader).toBeDefined();
      expect(CardStyles.cardTitle).toBeDefined();
      expect(CardStyles.cardSubtitle).toBeDefined();
    });

    it('should have valid style objects', () => {
      expect(typeof CardStyles.card).toBe('object');
      expect(typeof CardStyles.cardTitle).toBe('object');
    });

    it('should have backgroundColor in card styles', () => {
      expect(CardStyles.card).toHaveProperty('backgroundColor');
      expect(CardStyles.cardFullWidth).toHaveProperty('backgroundColor');
    });
  });

  describe('ListStyles', () => {
    it('should be defined', () => {
      expect(ListStyles).toBeDefined();
    });

    it('should have expected list style keys', () => {
      expect(ListStyles.listItem).toBeDefined();
      expect(ListStyles.listItemCompact).toBeDefined();
      expect(ListStyles.listItemContent).toBeDefined();
      expect(ListStyles.listItemTitle).toBeDefined();
      expect(ListStyles.listItemSubtitle).toBeDefined();
      expect(ListStyles.listItemAccessory).toBeDefined();
      expect(ListStyles.listItemValue).toBeDefined();
    });

    it('should have flexDirection in list item styles', () => {
      expect(ListStyles.listItem).toHaveProperty('flexDirection');
      expect(ListStyles.listItemCompact).toHaveProperty('flexDirection');
    });

    it('should have fontSize in text styles', () => {
      expect(ListStyles.listItemTitle).toHaveProperty('fontSize');
      expect(ListStyles.listItemSubtitle).toHaveProperty('fontSize');
    });
  });

  describe('ButtonStyles', () => {
    it('should be defined', () => {
      expect(ButtonStyles).toBeDefined();
    });

    it('should have expected button style keys', () => {
      expect(ButtonStyles.primary).toBeDefined();
      expect(ButtonStyles.primaryText).toBeDefined();
      expect(ButtonStyles.secondary).toBeDefined();
      expect(ButtonStyles.secondaryText).toBeDefined();
      expect(ButtonStyles.tertiary).toBeDefined();
      expect(ButtonStyles.tertiaryText).toBeDefined();
    });

    it('should have backgroundColor in button styles', () => {
      expect(ButtonStyles.primary).toHaveProperty('backgroundColor');
      expect(ButtonStyles.secondary).toHaveProperty('backgroundColor');
    });

    it('should have color in text styles', () => {
      expect(ButtonStyles.primaryText).toHaveProperty('color');
      expect(ButtonStyles.secondaryText).toHaveProperty('color');
    });

    it('should have small and fullWidth variants', () => {
      expect(ButtonStyles.small).toBeDefined();
      expect(ButtonStyles.fullWidth).toBeDefined();
      expect(ButtonStyles.disabled).toBeDefined();
    });

    it('should have destructive button style', () => {
      expect(ButtonStyles.destructive).toBeDefined();
      expect(ButtonStyles.destructiveText).toBeDefined();
    });
  });

  describe('InputStyles', () => {
    it('should be defined', () => {
      expect(InputStyles).toBeDefined();
    });

    it('should have expected input style keys', () => {
      expect(InputStyles.input).toBeDefined();
      expect(InputStyles.inputContainer).toBeDefined();
      expect(InputStyles.inputLabel).toBeDefined();
      expect(InputStyles.inputError).toBeDefined();
      expect(InputStyles.errorMessage).toBeDefined();
    });

    it('should have backgroundColor in input', () => {
      expect(InputStyles.input).toHaveProperty('backgroundColor');
    });

    it('should have fontSize in input and label', () => {
      expect(InputStyles.input).toHaveProperty('fontSize');
      expect(InputStyles.inputLabel).toHaveProperty('fontSize');
    });
  });

  describe('SectionStyles', () => {
    it('should be defined', () => {
      expect(SectionStyles).toBeDefined();
    });

    it('should have expected section style keys', () => {
      expect(SectionStyles.section).toBeDefined();
      expect(SectionStyles.sectionHeader).toBeDefined();
      expect(SectionStyles.sectionTitle).toBeDefined();
      expect(SectionStyles.sectionSubtitle).toBeDefined();
    });

    it('should have marginBottom in section', () => {
      expect(SectionStyles.section).toHaveProperty('marginBottom');
    });

    it('should have fontSize in title and subtitle', () => {
      expect(SectionStyles.sectionTitle).toHaveProperty('fontSize');
      expect(SectionStyles.sectionSubtitle).toHaveProperty('fontSize');
    });
  });

  describe('ModalStyles', () => {
    it('should be defined', () => {
      expect(ModalStyles).toBeDefined();
    });

    it('should have expected modal style keys', () => {
      expect(ModalStyles.overlay).toBeDefined();
      expect(ModalStyles.overlayCentered).toBeDefined();
      expect(ModalStyles.contentBottomSheet).toBeDefined();
      expect(ModalStyles.contentCentered).toBeDefined();
      expect(ModalStyles.title).toBeDefined();
      expect(ModalStyles.buttonRow).toBeDefined();
      expect(ModalStyles.buttonFlex).toBeDefined();
    });

    it('should have backgroundColor in overlay styles', () => {
      expect(ModalStyles.overlay).toHaveProperty('backgroundColor');
      expect(ModalStyles.overlayCentered).toHaveProperty('backgroundColor');
    });

    it('should have justifyContent in overlay styles', () => {
      expect(ModalStyles.overlay).toHaveProperty('justifyContent');
      expect(ModalStyles.overlayCentered).toHaveProperty('justifyContent');
    });
  });

  describe('ProgressStyles', () => {
    it('should be defined', () => {
      expect(ProgressStyles).toBeDefined();
    });

    it('should have expected progress style keys', () => {
      expect(ProgressStyles.barBackground).toBeDefined();
      expect(ProgressStyles.barFill).toBeDefined();
      expect(ProgressStyles.barContainer).toBeDefined();
      expect(ProgressStyles.barLabelRow).toBeDefined();
      expect(ProgressStyles.barLabel).toBeDefined();
      expect(ProgressStyles.barValue).toBeDefined();
    });

    it('should have height in bar styles', () => {
      expect(ProgressStyles.barBackground).toHaveProperty('height');
      expect(ProgressStyles.barFill).toHaveProperty('height');
    });

    it('should have fontSize in label styles', () => {
      expect(ProgressStyles.barLabel).toHaveProperty('fontSize');
      expect(ProgressStyles.barValue).toHaveProperty('fontSize');
    });
  });

  describe('SharedStyles Export', () => {
    it('should export all style categories', () => {
      expect(SharedStyles.card).toBe(CardStyles);
      expect(SharedStyles.list).toBe(ListStyles);
      expect(SharedStyles.button).toBe(ButtonStyles);
      expect(SharedStyles.input).toBe(InputStyles);
      expect(SharedStyles.section).toBe(SectionStyles);
      expect(SharedStyles.modal).toBe(ModalStyles);
      expect(SharedStyles.progress).toBe(ProgressStyles);
    });

    it('should be an object with all categories', () => {
      expect(typeof SharedStyles).toBe('object');
      expect(Object.keys(SharedStyles).length).toBe(7);
    });
  });
});
